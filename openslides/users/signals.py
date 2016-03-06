from django.contrib.auth.models import Permission
from django.db.models import Q
from django.utils.translation import ugettext as _
from django.utils.translation import ugettext_lazy

from ..core.config import ConfigVariable
from .models import Group, User


def setup_users_config(sender, **kwargs):
    """
    Receiver function to setup all users config variables. They are grouped
    in 'Sorting' and 'PDF'. This function is connected to the signal
    openslides.core.signals.config_signal during app loading.
    """

    # Sorting

    yield ConfigVariable(
        name='users_sort_users_by_first_name',
        default_value=False,
        input_type='boolean',
        label=ugettext_lazy('Sort users by first name'),
        help_text=ugettext_lazy('Disable for sorting by last name'),
        weight=510,
        group=ugettext_lazy('Users'),
        subgroup=ugettext_lazy('Sorting'))

    # PDF

    yield ConfigVariable(
        name='users_pdf_welcometitle',
        default_value=_('Welcome to OpenSlides!'),
        label=ugettext_lazy('Title for access data and welcome PDF'),
        weight=520,
        group=ugettext_lazy('Users'),
        subgroup=ugettext_lazy('PDF'),
        translatable=True)

    yield ConfigVariable(
        name='users_pdf_welcometext',
        default_value=_('[Place for your welcome and help text.]'),
        label=ugettext_lazy('Help text for access data and welcome PDF'),
        weight=530,
        group=ugettext_lazy('Users'),
        subgroup=ugettext_lazy('PDF'),
        translatable=True)

    # TODO: Use Django's URLValidator here.
    yield ConfigVariable(
        name='users_pdf_url',
        default_value='http://example.com:8000',
        label=ugettext_lazy('System URL'),
        help_text=ugettext_lazy('Used for QRCode in PDF of access data.'),
        weight=540,
        group=ugettext_lazy('Users'),
        subgroup=ugettext_lazy('PDF'))

    yield ConfigVariable(
        name='users_pdf_wlan_ssid',
        default_value='',
        label=ugettext_lazy('WLAN name (SSID)'),
        help_text=ugettext_lazy('Used for WLAN QRCode in PDF of access data.'),
        weight=550,
        group=ugettext_lazy('Users'),
        subgroup=ugettext_lazy('PDF'))

    yield ConfigVariable(
        name='users_pdf_wlan_password',
        default_value='',
        label=ugettext_lazy('WLAN password'),
        help_text=ugettext_lazy('Used for WLAN QRCode in PDF of access data.'),
        weight=560,
        group=ugettext_lazy('Users'),
        subgroup=ugettext_lazy('PDF'))

    yield ConfigVariable(
        name='users_pdf_wlan_encryption',
        default_value='',
        input_type='choice',
        label=ugettext_lazy('WLAN encryption'),
        help_text=ugettext_lazy('Used for WLAN QRCode in PDF of access data.'),
        choices=(
            {'value': '', 'display_name': '---------'},
            {'value': 'WEP', 'display_name': ugettext_lazy('WEP')},
            {'value': 'WPA', 'display_name': ugettext_lazy('WPA/WPA2')},
            {'value': 'nopass', 'display_name': ugettext_lazy('No encryption')}),
        weight=570,
        group=ugettext_lazy('Users'),
        subgroup=ugettext_lazy('PDF'))


def create_builtin_groups_and_admin(**kwargs):
    """
    Creates the builtin groups: Anonymous, Registered, Delegates and Staff.

    Creates the builtin user: admin.
    """
    # Check whether the group pks 1 to 4 are free
    if Group.objects.filter(pk__in=range(1, 5)).exists():
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

    # Create or reset admin user
    User.objects.create_or_reset_admin_user()
