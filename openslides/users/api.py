from .models import Permission


def get_protected_perm():
    """
    Returns the permission to manage users. This function is a helper
    function used to protect manager users from locking out themselves.
    """
    return Permission.objects.get_by_natural_key(
        app_label='users', model='user', codename='can_manage')
