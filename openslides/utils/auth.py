from typing import Dict, List, Union, cast

from asgiref.sync import async_to_sync
from django.apps import apps
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from django.core.exceptions import ImproperlyConfigured
from django.db.models import Model

from .cache import element_cache


GROUP_DEFAULT_PK = 1  # This is the hard coded pk for the default group.
GROUP_ADMIN_PK = 2  # This is the hard coded pk for the admin group.

# Hard coded collection string for users and groups
group_collection_string = "users/group"
user_collection_string = "users/user"


def get_group_model() -> Model:
    """
    Return the Group model that is active in this project.
    """
    try:
        return apps.get_model(settings.AUTH_GROUP_MODEL, require_ready=False)
    except ValueError:
        raise ImproperlyConfigured(
            "AUTH_GROUP_MODEL must be of the form 'app_label.model_name'"
        )
    except LookupError:
        raise ImproperlyConfigured(
            "AUTH_GROUP_MODEL refers to model '%s' that has not been installed"
            % settings.AUTH_GROUP_MODEL
        )


def has_perm(user_id: int, perm: str) -> bool:
    """
    Checks that user has a specific permission.

    user_id 0 means anonymous user.
    """
    # Convert user to right type
    # TODO: Remove this and make use, that user has always the right type
    user_id = user_to_user_id(user_id)
    return async_to_sync(async_has_perm)(user_id, perm)


async def async_has_perm(user_id: int, perm: str) -> bool:
    """
    Checks that user has a specific permission.

    user_id 0 means anonymous user.
    """
    if not user_id and not await async_anonymous_is_enabled():
        has_perm = False
    elif not user_id:
        # Use the permissions from the default group.
        default_group = await element_cache.get_element_full_data(
            group_collection_string, GROUP_DEFAULT_PK
        )
        if default_group is None:
            raise RuntimeError("Default Group does not exist.")
        has_perm = perm in default_group["permissions"]
    else:
        user_data = await element_cache.get_element_full_data(
            user_collection_string, user_id
        )
        if user_data is None:
            raise RuntimeError("User with id {} does not exist.".format(user_id))
        if GROUP_ADMIN_PK in user_data["groups_id"]:
            # User in admin group (pk 2) grants all permissions.
            has_perm = True
        else:
            # Get all groups of the user and then see, if one group has the required
            # permission. If the user has no groups, then use the default group.
            group_ids = user_data["groups_id"] or [GROUP_DEFAULT_PK]
            for group_id in group_ids:
                group = await element_cache.get_element_full_data(
                    group_collection_string, group_id
                )
                if group is None:
                    raise RuntimeError(
                        "User is in non existing group with id {}.".format(group_id)
                    )

                if perm in group["permissions"]:
                    has_perm = True
                    break
            else:
                has_perm = False
    return has_perm


def in_some_groups(user_id: int, groups: List[int]) -> bool:
    """
    Checks that user is in at least one given group. Groups can be given as a list
    of ids or group instances. If the user is in the admin group (pk = 2) the result
    is always true.

    user_id 0 means anonymous user.
    """

    if len(groups) == 0:
        return False  # early end here, if no groups are given.

    # Convert user to right type
    # TODO: Remove this and make use, that user has always the right type
    user_id = user_to_user_id(user_id)
    return async_to_sync(async_in_some_groups)(user_id, groups)


async def async_in_some_groups(user_id: int, groups: List[int]) -> bool:
    """
    Checks that user is in at least one given group. Groups can be given as a list
    of ids. If the user is in the admin group (pk = 2) the result
    is always true.

    user_id 0 means anonymous user.
    """

    if not len(groups):
        return False  # early end here, if no groups are given.

    if not user_id and not await async_anonymous_is_enabled():
        in_some_groups = False
    elif not user_id:
        # Use the permissions from the default group.
        in_some_groups = GROUP_DEFAULT_PK in groups
    else:
        user_data = await element_cache.get_element_full_data(
            user_collection_string, user_id
        )
        if user_data is None:
            raise RuntimeError("User with id {} does not exist.".format(user_id))
        if GROUP_ADMIN_PK in user_data["groups_id"]:
            # User in admin group (pk 2) grants all permissions.
            in_some_groups = True
        else:
            # Get all groups of the user and then see, if one group has the required
            # permission. If the user has no groups, then use the default group.
            group_ids = user_data["groups_id"] or [GROUP_DEFAULT_PK]
            for group_id in group_ids:
                if group_id in groups:
                    in_some_groups = True
                    break
            else:
                in_some_groups = False
    return in_some_groups


def anonymous_is_enabled() -> bool:
    """
    Returns True if the anonymous user is enabled in the settings.
    """
    from ..core.config import config

    return config["general_system_enable_anonymous"]


async def async_anonymous_is_enabled() -> bool:
    """
    Like anonymous_is_enabled but async.
    """
    from ..core.config import config

    if config.key_to_id is None:
        await config.build_key_to_id()
        config.key_to_id = cast(Dict[str, int], config.key_to_id)
    element = await element_cache.get_element_full_data(
        config.get_collection_string(),
        config.key_to_id["general_system_enable_anonymous"],
    )
    return False if element is None else element["value"]


AnyUser = Union[Model, int, AnonymousUser, None]


def user_to_user_id(user: AnyUser) -> int:
    """
    Takes an object, that represents a user returns its user_id.

    user_id 0 means anonymous user.

    User can be
    * an user object,
    * an user id or
    * an anonymous user.

    Raises an TypeError, if the given user object can not be converted.
    """
    User = get_user_model()

    if user is None:
        user_id = 0
    elif isinstance(user, int):
        # Nothing to do
        user_id = user
    elif isinstance(user, AnonymousUser):
        user_id = 0
    elif isinstance(user, User):
        user_id = user.pk
    else:
        raise TypeError(
            "Unsupported type for user. User {} has type {}.".format(user, type(user))
        )
    return user_id
