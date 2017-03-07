from django.apps import apps
from django.contrib.auth.models import Permission
from django.db.models import Q

from ..utils.autoupdate import inform_changed_data
from .models import Group, User


def get_permission_change_data(sender, permissions=None, **kwargs):
    """
    Yields all necessary collections if 'users.can_see_name' permission changes.
    """
    users_app = apps.get_app_config(app_label='users')
    for permission in permissions:
        # There could be only one 'users.can_see_name' and then we want to return data.
        if permission.content_type.app_label == users_app.label and permission.codename == 'can_see_name':
            yield from users_app.get_startup_elements()


def create_builtin_groups_and_admin(**kwargs):
    """
    Creates the builtin groups: Default, Delegates, Staff and Committees.

    Creates the builtin user: admin.
    """
    # Check whether there are groups in the database.
    if Group.objects.exists():
        # Do completely nothing if there are already some groups in the database.
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
        'core.can_manage_chat',
        'core.can_see_frontpage',
        'core.can_see_projector',
        'core.can_use_chat',
        'mediafiles.can_manage',
        'mediafiles.can_see',
        'mediafiles.can_see_hidden',
        'mediafiles.can_upload',
        'motions.can_create',
        'motions.can_manage',
        'motions.can_see',
        'motions.can_see_and_manage_comments',
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

    # Default (pk 1)
    base_permissions = (
        permission_dict['agenda.can_see'],
        permission_dict['agenda.can_see_hidden_items'],
        permission_dict['assignments.can_see'],
        permission_dict['core.can_see_frontpage'],
        permission_dict['core.can_see_projector'],
        permission_dict['mediafiles.can_see'],
        permission_dict['motions.can_see'],
        permission_dict['users.can_see_name'], )
    group_default = Group.objects.create(name='Default')
    group_default.permissions.add(*base_permissions)

    # Delegates (pk 2)
    delegates_permissions = (
        permission_dict['agenda.can_see'],
        permission_dict['agenda.can_see_hidden_items'],
        permission_dict['agenda.can_be_speaker'],
        permission_dict['assignments.can_see'],
        permission_dict['assignments.can_nominate_other'],
        permission_dict['assignments.can_nominate_self'],
        permission_dict['core.can_see_frontpage'],
        permission_dict['core.can_see_projector'],
        permission_dict['mediafiles.can_see'],
        permission_dict['mediafiles.can_upload'],
        permission_dict['motions.can_see'],
        permission_dict['motions.can_create'],
        permission_dict['motions.can_support'],
        permission_dict['users.can_see_name'], )
    group_delegates = Group.objects.create(name='Delegates')
    group_delegates.permissions.add(*delegates_permissions)

    # Staff (pk 3)
    staff_permissions = (
        permission_dict['agenda.can_see'],
        permission_dict['agenda.can_see_hidden_items'],
        permission_dict['agenda.can_be_speaker'],
        permission_dict['agenda.can_manage'],
        permission_dict['assignments.can_see'],
        permission_dict['assignments.can_manage'],
        permission_dict['assignments.can_nominate_other'],
        permission_dict['assignments.can_nominate_self'],
        permission_dict['core.can_see_frontpage'],
        permission_dict['core.can_see_projector'],
        permission_dict['core.can_manage_config'],
        permission_dict['core.can_manage_projector'],
        permission_dict['core.can_manage_tags'],
        permission_dict['core.can_use_chat'],
        permission_dict['core.can_manage_chat'],
        permission_dict['mediafiles.can_see'],
        permission_dict['mediafiles.can_manage'],
        permission_dict['mediafiles.can_upload'],
        permission_dict['motions.can_see'],
        permission_dict['motions.can_create'],
        permission_dict['motions.can_manage'],
        permission_dict['motions.can_see_and_manage_comments'],
        permission_dict['users.can_see_name'],
        permission_dict['users.can_manage'],
        permission_dict['users.can_see_extra_data'],
        permission_dict['mediafiles.can_see_hidden'],)
    group_staff = Group.objects.create(name='Staff')
    group_staff.permissions.add(*staff_permissions)

    # Add users.can_see_name permission to staff
    # group to ensure proper management possibilities
    # TODO: Remove this redundancy after cleanup of the permission system.
    group_staff.permissions.add(
        permission_dict['users.can_see_name'])

    # Committees (pk 4)
    committees_permissions = (
        permission_dict['agenda.can_see'],
        permission_dict['agenda.can_see_hidden_items'],
        permission_dict['agenda.can_be_speaker'],
        permission_dict['assignments.can_see'],
        permission_dict['core.can_see_frontpage'],
        permission_dict['core.can_see_projector'],
        permission_dict['mediafiles.can_see'],
        permission_dict['mediafiles.can_upload'],
        permission_dict['motions.can_see'],
        permission_dict['motions.can_create'],
        permission_dict['motions.can_support'],
        permission_dict['users.can_see_name'], )
    group_committee = Group.objects.create(name='Committees')
    group_committee.permissions.add(*committees_permissions)

    # Create or reset admin user
    User.objects.create_or_reset_admin_user()

    # After each group was created, the permissions (many to many fields) where
    # added to the group. So we have to update the cache by calling
    # inform_changed_data().
    inform_changed_data((group_default, group_delegates, group_staff, group_committee))
