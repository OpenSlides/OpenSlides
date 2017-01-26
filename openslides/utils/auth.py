from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser

from .collection import CollectionElement


def has_perm(user, perm):
    """
    Checks that user has a specific permission.

    User can be an a CollectionElement for a user or None.
    """
    # Convert user to right type
    user = user_to_collection_user(user)
    if user is None and not anonymous_is_enabled():
        has_perm = False
    elif user is None:
        # Use the permissions from the default group.
        default_group = CollectionElement.from_values('users/group', 1)
        has_perm = perm in default_group.get_full_data()['permissions']
    else:
        # Get all groups of the user and then see, if one group has the required
        # permission. If the user has no groups, then use group 1.
        group_ids = user.get_full_data()['groups_id'] or [1]
        for group_id in group_ids:
            group = CollectionElement.from_values('users/group', group_id)
            if perm in group.get_full_data()['permissions']:
                has_perm = True
                break
        else:
            has_perm = False
    return has_perm


def anonymous_is_enabled():
    """
    Returns true, when the anonymous user is enabled in the settings.
    """
    return (CollectionElement.from_values('core/config', 'general_system_enable_anonymous')
            .get_full_data()['value'])


def user_to_collection_user(user):
    """
    Taks an object, that represents a user an converts it to a collection_element
    or None, if it is an anonymous user.

    User can be
    * a user object,
    * a collection_element for an user
    * an user id
    * an anonymous user.

    Raises an TypeError, if the given user object can not be converted
    """
    if user is None:
        # Nothing to do
        pass
    elif isinstance(user, CollectionElement) and user.collection_string == 'users/user':
        # Nothing to do
        pass
    elif isinstance(user, CollectionElement):
        raise TypeError(
            "Unsupported type for user. Only CollectionElements for users can be"
            "used. Not {}".format(user.collection_string))
    elif isinstance(user, int):
        user = CollectionElement.from_values('users/user', user)
    elif isinstance(user, AnonymousUser):
        user = None
    elif isinstance(user, get_user_model()):
        # Converts a user object to a collection element.
        # from_instance can not be used because the user serializer loads
        # the group from the db. So each call to from_instance(user) consts
        # one db query.
        user = CollectionElement.from_values('users/user', user.id)
    else:
        raise TypeError(
            "Unsupported type for user. User {} has type {}.".format(user, type(user)))
    return user
