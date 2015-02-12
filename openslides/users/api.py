from random import choice

from django.contrib.auth.models import Permission, Group
from django.contrib.contenttypes.models import ContentType
from django.utils.translation import ugettext_noop

from .models import User


def gen_password():
    """
    Generates a random passwort.
    """
    chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    size = 8

    return ''.join([choice(chars) for i in range(size)])


def gen_username(first_name, last_name):
    """
    Generates a username from a first- and lastname.
    """
    first_name = first_name.strip()
    last_name = last_name.strip()

    if first_name and last_name:
        base_name = " ".join((first_name, last_name))
    else:
        base_name = first_name or last_name
        if not base_name:
            raise ValueError('Either \'first_name\' or \'last_name\' can not be '
                             'empty')

    if not User.objects.filter(username=base_name).exists():
        return base_name

    counter = 0
    while True:
        counter += 1
        test_name = "%s %d" % (base_name, counter)
        if not User.objects.filter(username=test_name).exists():
            return test_name


def get_registered_group():
    """
    Returns the group 'Registered' (pk=2).
    """
    return Group.objects.get(pk=2)


def create_builtin_groups_and_admin():
    """
    Creates the builtin groups: Anonymous, Registered, Delegates and Staff.

    Creates the builtin user: admin.
    """
    # Check whether the group pks 1 to 4 are free
    if Group.objects.filter(pk__in=range(1, 5)).exists():
        # Do completely nothing if there are already some of our groups in the database.
        return

    # Anonymous (pk 1) and Registered (pk 2)
    ct_core = ContentType.objects.get(app_label='core', model='customslide')
    perm_11 = Permission.objects.get(content_type=ct_core, codename='can_see_projector')
    perm_12 = Permission.objects.get(content_type=ct_core, codename='can_see_dashboard')

    ct_agenda = ContentType.objects.get(app_label='agenda', model='item')
    ct_speaker = ContentType.objects.get(app_label='agenda', model='speaker')
    perm_13 = Permission.objects.get(content_type=ct_agenda, codename='can_see_agenda')
    perm_14 = Permission.objects.get(content_type=ct_agenda, codename='can_see_orga_items')
    can_speak = Permission.objects.get(content_type=ct_speaker, codename='can_be_speaker')

    ct_motion = ContentType.objects.get(app_label='motion', model='motion')
    perm_15 = Permission.objects.get(content_type=ct_motion, codename='can_see_motion')

    ct_assignment = ContentType.objects.get(app_label='assignment', model='assignment')
    perm_16 = Permission.objects.get(content_type=ct_assignment, codename='can_see_assignments')

    ct_users = ContentType.objects.get(app_label='users', model='user')
    perm_users_can_see_name = Permission.objects.get(content_type=ct_users, codename='can_see_name')
    perm_users_can_see_extra_data = Permission.objects.get(content_type=ct_users, codename='can_see_extra_data')

    ct_mediafile = ContentType.objects.get(app_label='mediafile', model='mediafile')
    perm_18 = Permission.objects.get(content_type=ct_mediafile, codename='can_see')

    base_permission_list = (
        perm_11,
        perm_12,
        perm_13,
        perm_14,
        perm_15,
        perm_16,
        perm_users_can_see_name,
        perm_users_can_see_extra_data,
        perm_18)

    group_anonymous = Group.objects.create(name=ugettext_noop('Anonymous'), pk=1)
    group_anonymous.permissions.add(*base_permission_list)
    group_registered = Group.objects.create(name=ugettext_noop('Registered'), pk=2)
    group_registered.permissions.add(can_speak, *base_permission_list)

    # Delegates (pk 3)
    perm_31 = Permission.objects.get(content_type=ct_motion, codename='can_create_motion')
    perm_32 = Permission.objects.get(content_type=ct_motion, codename='can_support_motion')
    perm_33 = Permission.objects.get(content_type=ct_assignment, codename='can_nominate_other')
    perm_34 = Permission.objects.get(content_type=ct_assignment, codename='can_nominate_self')
    perm_35 = Permission.objects.get(content_type=ct_mediafile, codename='can_upload')

    group_delegates = Group.objects.create(name=ugettext_noop('Delegates'), pk=3)
    group_delegates.permissions.add(perm_31, perm_32, perm_33, perm_34, perm_35)

    # Staff (pk 4)
    perm_41 = Permission.objects.get(content_type=ct_agenda, codename='can_manage_agenda')
    perm_42 = Permission.objects.get(content_type=ct_motion, codename='can_manage_motion')
    perm_43 = Permission.objects.get(content_type=ct_assignment, codename='can_manage_assignments')
    perm_44 = Permission.objects.get(content_type=ct_users, codename='can_manage')
    perm_45 = Permission.objects.get(content_type=ct_core, codename='can_manage_projector')
    perm_46 = Permission.objects.get(content_type=ct_core, codename='can_use_chat')
    perm_47 = Permission.objects.get(content_type=ct_mediafile, codename='can_manage')

    ct_config = ContentType.objects.get(app_label='config', model='configstore')
    perm_48 = Permission.objects.get(content_type=ct_config, codename='can_manage')

    ct_tag = ContentType.objects.get(app_label='core', model='tag')
    can_manage_tags = Permission.objects.get(content_type=ct_tag, codename='can_manage_tags')

    group_staff = Group.objects.create(name=ugettext_noop('Staff'), pk=4)
    # add delegate permissions (without can_support_motion)
    group_staff.permissions.add(perm_31, perm_33, perm_34, perm_35)
    # add staff permissions
    group_staff.permissions.add(perm_41, perm_42, perm_43, perm_44, perm_45, perm_46, perm_47, perm_48, can_manage_tags)
    # add can_see_name and can_see_extra_data permissions
    # TODO: Remove this redundancy after cleanup of the permission system.
    group_staff.permissions.add(perm_users_can_see_name, perm_users_can_see_extra_data)

    # Admin user
    create_or_reset_admin_user()


def create_or_reset_admin_user():
    group_staff = Group.objects.get(pk=4)
    try:
        admin = User.objects.get(username="admin")
    except User.DoesNotExist:
        admin = User()
        admin.username = 'admin'
        admin.last_name = 'Administrator'
        created = True
    else:
        created = False
    admin.default_password = 'admin'
    admin.set_password(admin.default_password)
    admin.save()
    admin.groups.add(group_staff)
    return created


def get_protected_perm():
    """
    Returns the permission to manage users. This function is a helper
    function used to protect manager users from locking out themselves.
    """
    return Permission.objects.get_by_natural_key(
        app_label='users', model='user', codename='can_manage')
