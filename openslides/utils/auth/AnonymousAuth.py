# -*- coding: utf-8 -*-

from django.contrib.auth.models import Permission

from openslides.config.api import config


class AnonymousAuth(object):
    """
    Authenticates the AnonymousUser against the Permission-Group 'Anonymous'.
    No rights are granted unless the group is defined and contains them.
    """
    supports_anonymous_user = True
    supports_inactive_user = True
    supports_object_permissions = False

    def authenticate(self, username=None, password=None):
        """
        Authenticate a user based in username / password.

        - always return None as anonymous can't login.
        """
        return None

    def get_group_permissions(self, user_obj, obj=None):
        """
        Return the permissions a user is graneted by his group membership(s).

        - try to return the permissions for the 'Anonymous' group (pk=1).
        """
        if (not user_obj.is_anonymous() or obj is not None or
                not config['system_enable_anonymous']):
            return set()

        perms = Permission.objects.filter(group__pk=1)
        if perms is None:
            return set()
        perms = perms.values_list('content_type__app_label', 'codename') \
            .order_by()
        return set([u'%s.%s' % (ct, name) for ct, name in perms])

    def get_all_permissions(self, user_obj, obj=None):
        """
        Return all permissions a user is granted including goup permissions.

        - for anonymous it's identical to get_group_permissions
        """
        return self.get_group_permissions(user_obj, obj)

    def has_perm(self, user_obj, perm, obj=None):
        """
        Check if the user as a specific permission
        """
        if (not user_obj.is_anonymous() or obj is not None or
                not config['system_enable_anonymous']):
            return False

        return (perm in self.get_all_permissions(user_obj))

    def has_module_perm(self, user_obj, app_label):
        """
        Check if the user has permissions on the module app_label
        """
        if (not user_obj.is_anonymous() or
                not config['system_enable_anonymous']):
            return False

        for perm in self.get_all_permissions(user_obj):
            if perm[:perm.index('.')] == app_label:
                return True
        return False

    def get_user(self, user_id):
        """
        Return the User object for user_id

        - for anonymous it's always None
        """
        return None


def anonymous_context_additions(RequestContext):
    """
    Add a variable to the request context that will indicate
    if anonymous login is possible at all.
    """
    return {'os_enable_anonymous_login': config['system_enable_anonymous']}
