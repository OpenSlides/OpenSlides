from django.contrib.auth import get_user as _get_user
from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from django.contrib.auth.models import AnonymousUser as DjangoAnonymousUser
from django.contrib.auth.models import Permission
from django.utils.functional import SimpleLazyObject
from rest_framework.authentication import BaseAuthentication

from ..core.config import config


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
    def get_all_permissions(self, obj=None):
        """
        Returns the permissions a user is granted by his group membership(s).

        Try to return the permissions for the 'Anonymous' group (pk=1).
        """
        perms = Permission.objects.filter(group__pk=1)
        if perms is None:
            return set()
        # TODO: Test without order_by()
        perms = perms.values_list('content_type__app_label', 'codename').order_by()
        return set(['%s.%s' % (content_type, codename) for content_type, codename in perms])

    def has_perm(self, perm, obj=None):
        """
        Checks if the user has a specific permission.
        """
        return (perm in self.get_all_permissions())

    def has_module_perms(self, app_label):
        """
        Checks if the user has permissions on the module app_label.
        """
        for perm in self.get_all_permissions():
            if perm[:perm.index('.')] == app_label:
                return True
        return False


class RESTFrameworkAnonymousAuthentication(BaseAuthentication):
    """
    Authentication class for the Django REST framework.

    Sets the user to the our AnonymousUser but only if
    general_system_enable_anonymous is set to True in the config.
    """

    def authenticate(self, request):
        if config['general_system_enable_anonymous']:
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
            "'openslides.users.auth.AuthenticationMiddleware'."
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
        if config['general_system_enable_anonymous'] and isinstance(return_user, DjangoAnonymousUser):
            return_user = AnonymousUser()
        request._cached_user = return_user
    return return_user
