from django.contrib.auth import get_user as _get_user
from django.contrib.auth import get_user_model
from django.utils.functional import SimpleLazyObject
from rest_framework.authentication import BaseAuthentication

from ..core.config import config
from .models import GroupPermission, Group


# Registered users

class ModelBackend(object):
    #TODO: fixme
    """
    Authenticates against settings.AUTH_USER_MODEL.

    This is a hard copy of django.contrib.auth.backands with the difference, that
    our permission system is used. Changes are markt with the comment:
    'Changed for OpenSlides'
    """

    def authenticate(self, username=None, password=None, **kwargs):
        UserModel = get_user_model()
        if username is None:
            username = kwargs.get(UserModel.USERNAME_FIELD)
        try:
            user = UserModel._default_manager.get_by_natural_key(username)
        except UserModel.DoesNotExist:
            # Run the default password hasher once to reduce the timing
            # difference between an existing and a non-existing user (#20760).
            UserModel().set_password(password)
        else:
            if user.check_password(password) and self.user_can_authenticate(user):
                return user

    def user_can_authenticate(self, user):
        """
        Reject users with is_active=False. Custom user models that don't have
        that attribute are allowed.
        """
        is_active = getattr(user, 'is_active', None)
        return is_active or is_active is None

    def _get_user_permissions(self, user_obj):
        # Changed for OpenSlides: Our users do not have permissions
        return set()

    def _get_group_permissions(self, user_obj):
        # Changed for OpenSlides: Use our permission system. Add the default
        # group.
        result = set()
        # TODO: Try to use one query
        for permission in GroupPermission.objects.filter('group__users'):
            result.add(permission.permission)
        for permission in GroupPermission.objects.filter(pk=1):
            result.add(permission.permission)
        return result

    def _get_permissions(self, user_obj, obj, from_name):
        """
        Returns the permissions of `user_obj` from `from_name`. `from_name` can
        be either "group" or "user" to return permissions from
        `_get_group_permissions` or `_get_user_permissions` respectively.
        """
        if not user_obj.is_active or user_obj.is_anonymous or obj is not None:
            return set()

        perm_cache_name = '_%s_perm_cache' % from_name
        if not hasattr(user_obj, perm_cache_name):
            # Changed for OpenSlides: We don't have superusers and the functions
            # above return the correct set directly
            perms = getattr(self, '_get_%s_permissions' % from_name)(user_obj)
            setattr(user_obj, perm_cache_name, perms)
        return getattr(user_obj, perm_cache_name)

    def get_user_permissions(self, user_obj, obj=None):
        """
        Returns a set of permission strings the user `user_obj` has from their
        `user_permissions`.
        """
        return self._get_permissions(user_obj, obj, 'user')

    def get_group_permissions(self, user_obj, obj=None):
        """
        Returns a set of permission strings the user `user_obj` has from the
        groups they belong.
        """
        return self._get_permissions(user_obj, obj, 'group')

    def get_all_permissions(self, user_obj, obj=None):
        if not user_obj.is_active or user_obj.is_anonymous or obj is not None:
            return set()
        if not hasattr(user_obj, '_perm_cache'):
            user_obj._perm_cache = self.get_user_permissions(user_obj)
            user_obj._perm_cache.update(self.get_group_permissions(user_obj))
        return user_obj._perm_cache

    def has_perm(self, user_obj, perm, obj=None):
        if not user_obj.is_active:
            return False
        return perm in self.get_all_permissions(user_obj, obj)

    def has_module_perms(self, user_obj, app_label):
        """
        Returns True if user_obj has any permissions in the given app_label.
        """
        if not user_obj.is_active:
            return False
        for perm in self.get_all_permissions(user_obj):
            if perm[:perm.index('.')] == app_label:
                return True
        return False

    def get_user(self, user_id):
        UserModel = get_user_model()
        try:
            user = UserModel._default_manager.get(pk=user_id)
        except UserModel.DoesNotExist:
            return None
        return user if self.user_can_authenticate(user) else None


# Anonymous users

class AnonymousUser:
    """
    Class for anonymous user instances which have the permissions from the
    group 'Anonymous' (pk=1).
    """

    def get_all_permissions(self, obj=None):
        """
        Returns the permissions a user is granted by his group membership(s).

        Try to return the permissions for the 'Anonymous' group (pk=1).
        """
        anonymous_group = Group.objects.get(pk=1)
        perms = set()
        for permission in Permission.objects.filter(group__pk=1):
            perms.add(permission.permission)
        return perms

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
        #TODO fixme: remove the requirment of the djangoanonymoususer
        if config['general_system_enable_anonymous'] and isinstance(return_user, DjangoAnonymousUser):
            return_user = AnonymousUser()
        request._cached_user = return_user
    return return_user
