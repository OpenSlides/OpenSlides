from django.contrib.auth import get_user as _get_user
from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from django.contrib.auth.models import AnonymousUser as DjangoAnonymousUser
from django.contrib.auth.models import Permission
from django.utils.functional import SimpleLazyObject
from rest_framework.authentication import BaseAuthentication

from .collection import CollectionElement


# Registered users

class CustomizedModelBackend(ModelBackend):
    """
    Customized backend for authentication. Ensures that all users
    without a group have the permissions of the group 'Default' (pk=1).
    See AUTHENTICATION_BACKENDS settings.
    """
    def get_group_permissions(self, user_obj, obj=None):
        """
        Returns a set of permission strings that this user has through his/her
        groups.
        """
        # TODO: Refactor this after Django 1.8 is minimum requirement. Add
        #       also anonymous permission check to this backend.
        if user_obj.is_anonymous() or obj is not None:
            return set()
        if not hasattr(user_obj, '_group_perm_cache'):
            if user_obj.is_superuser:
                perms = Permission.objects.all()
            else:
                if user_obj.groups.all().count() == 0:  # user is in no group
                    perms = Permission.objects.filter(group__pk=1)  # group 'default' (pk=1)
                else:
                    user_groups_field = get_user_model()._meta.get_field('groups')
                    user_groups_query = 'group__%s' % user_groups_field.related_query_name()
                    perms = Permission.objects.filter(**{user_groups_query: user_obj})
            perms = perms.values_list('content_type__app_label', 'codename').order_by()
            user_obj._group_perm_cache = set("%s.%s" % (ct, name) for ct, name in perms)
        return user_obj._group_perm_cache


# Anonymous users

class AnonymousUser(DjangoAnonymousUser):
    """
    Class for anonymous user instances which have the permissions from the
    group 'Anonymous' (pk=1).
    """

    def has_perm(self, perm, obj=None):
        """
        Checks if the user has a specific permission.
        """
        default_group = CollectionElement.from_values('users/group', 1)
        return perm in default_group.get_full_data()['permissions']


class RESTFrameworkAnonymousAuthentication(BaseAuthentication):
    """
    Authentication class for the Django REST framework.

    Sets the user to the our AnonymousUser but only if
    anonymous user is enabled in the config.
    """

    def authenticate(self, request):
        if anonymous_is_enabled():
            return (AnonymousUser(), None)
        return None


class AuthenticationMiddleware:
    """
    Middleware to get the logged in user in users.

    Uses AnonymousUser instead of Django's anonymous user.
    """
    def process_request(self, request):
        """
        Like django.contrib.auth.middleware.AuthenticationMiddleware, but uses
        our own get_user function.
        """
        assert hasattr(request, 'session'), (
            "The authentication middleware requires session middleware "
            "to be installed. Edit your MIDDLEWARE_CLASSES setting to insert "
            "'django.contrib.sessions.middleware.SessionMiddleware' before "
            "'openslides.utils.auth.AuthenticationMiddleware'."
        )
        request.user = SimpleLazyObject(lambda: get_user(request))


def get_user(request):
    """
    Gets the user from the request.

    This is a mix of django.contrib.auth.get_user and
    django.contrib.auth.middleware.get_user which uses our anonymous user.
    """
    try:
        return_user = request._cached_user
    except AttributeError:
        # Get the user. If it is a DjangoAnonymousUser, then use our AnonymousUser
        return_user = _get_user(request)
        if anonymous_is_enabled() and isinstance(return_user, DjangoAnonymousUser):
            return_user = AnonymousUser()
        request._cached_user = return_user
    return return_user


def has_perm(user, perm):
    """
    Checks that user has a specific permission.

    User can be an user object, an user id  None (for anonymous) or a
    CollectionElement for a user.
    """
    # First, convert a user id or None to an anonymous user or an CollectionElement
    if user is None and anonymous_is_enabled():
        user = AnonymousUser()
    elif user is None:
        user = DjangoAnonymousUser()
    elif isinstance(user, int):
        user = CollectionElement.from_values('users/user', user)

    if isinstance(user, AnonymousUser):
        # Our anonymous user has a has_perm-method that works with the cache
        # system. So we can use it here.
        has_perm = user.has_perm(perm)
    elif isinstance(user, DjangoAnonymousUser):
        # The django anonymous user is only used when anonymous user is disabled
        # So he never has permissions to see anything.
        has_perm = False
    else:
        if isinstance(user, get_user_model()):
            # Converts a user object to a collection element.
            # from_instance can not be used because the user serializer loads
            # the group from the db. So each call to from_instance(user) consts
            # one db query.
            user = CollectionElement.from_values('users/user', user.id)

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
    from ..core.config import config
    return config['general_system_enable_anonymous']
