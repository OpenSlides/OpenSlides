from django.contrib.auth.models import Permission
from django.db.models import Q

from .models import Group, User


def create_builtin_groups_and_admin(**kwargs):
    """
    Creates the builtin groups: Anonymous, Registered, Delegates, Staff and
    Committees.

    Creates the builtin user: admin.
    """
    # Check whether the group pk's 1 to 5 are free.
    if Group.objects.filter(pk__in=range(1, 6)).exists():
        # Do completely nothing if there are already some of our groups in the database.
        return

    permission_strings = (
        'agenda.can_be_speaker',
        'agenda.can_manage',
        'agenda.can_see',
        'agenda.can_see_hidden_items',
        'assignments.can_manage',
        'assignments.can_nominate_other',
        'assignments.can_nominate_self',
        'assignments.can_see',
        'core.can_manage_config',
        'core.can_manage_projector',
        'core.can_manage_tags',
        'core.can_see_frontpage',
        'core.can_see_projector',
        'core.can_use_chat',
        'mediafiles.can_manage',
        'mediafiles.can_see',
        'mediafiles.can_upload',
        'motions.can_create',
        'motions.can_manage',
        'motions.can_see',
        'motions.can_support',
        'users.can_manage',
        'users.can_see_extra_data',
        'users.can_see_name', )
    permission_query = Q()
    permission_dict = {}

    # Load all permissions
    for permission_string in permission_strings:
        app_label, codename = permission_string.split('.')
        query_part = Q(content_type__app_label=app_label) & Q(codename=codename)
        permission_query = permission_query | query_part
    for permission in Permission.objects.select_related('content_type').filter(permission_query):
        permission_string = '.'.join((permission.content_type.app_label, permission.codename))
        permission_dict[permission_string] = permission

    # Anonymous (pk 1) and Registered (pk 2)
    base_permissions = (
        permission_dict['agenda.can_see'],
        permission_dict['agenda.can_see_hidden_items'],
        permission_dict['assignments.can_see'],
        permission_dict['core.can_see_frontpage'],
        permission_dict['core.can_see_projector'],
        permission_dict['mediafiles.can_see'],
        permission_dict['motions.can_see'],
        permission_dict['users.can_see_name'], )
    group_anonymous = Group.objects.create(name='Guests', pk=1)
    group_anonymous.permissions.add(*base_permissions)
    group_registered = Group.objects.create(name='Registered users', pk=2)
    group_registered.permissions.add(
        permission_dict['agenda.can_be_speaker'],
        *base_permissions)

    # Delegates (pk 3)
    delegates_permissions = (
        permission_dict['assignments.can_nominate_other'],
        permission_dict['assignments.can_nominate_self'],
        permission_dict['mediafiles.can_upload'],
        permission_dict['motions.can_create'],
        permission_dict['motions.can_support'], )
    group_delegates = Group.objects.create(name='Delegates', pk=3)
    group_delegates.permissions.add(*delegates_permissions)

    # Staff (pk 4)
    staff_permissions = (
        permission_dict['agenda.can_manage'],
        permission_dict['assignments.can_manage'],
        permission_dict['assignments.can_nominate_other'],
        permission_dict['assignments.can_nominate_self'],
        permission_dict['core.can_manage_config'],
        permission_dict['core.can_manage_projector'],
        permission_dict['core.can_manage_tags'],
        permission_dict['core.can_use_chat'],
        permission_dict['mediafiles.can_manage'],
        permission_dict['mediafiles.can_upload'],
        permission_dict['motions.can_create'],
        permission_dict['motions.can_manage'],
        permission_dict['users.can_manage'],
        permission_dict['users.can_see_extra_data'],)
    group_staff = Group.objects.create(name='Staff', pk=4)
    group_staff.permissions.add(*staff_permissions)

    # Add users.can_see_name permission to staff
    # group to ensure proper management possibilities
    # TODO: Remove this redundancy after cleanup of the permission system.
    group_staff.permissions.add(
        permission_dict['users.can_see_name'])

    # Committees (pk 5)
    committees_permissions = (
        permission_dict['mediafiles.can_upload'],
        permission_dict['motions.can_create'],
        permission_dict['motions.can_support'], )
    group_committee = Group.objects.create(name='Committees', pk=5)
    group_committee.permissions.add(*committees_permissions)

    # Create or reset admin user
    User.objects.create_or_reset_admin_user()
