from django import forms
from django.db.models import Q
from django.utils.translation import ugettext as _
from django.utils.translation import ugettext_lazy, ugettext_noop

from openslides.config.api import ConfigGroup, ConfigGroupedCollection, ConfigVariable

from .models import Group, Permission, User


def setup_users_config(sender, **kwargs):
    """
    Receiver function to setup all users config variables. It is connected
    to the signal openslides.config.signals.config_signal during app loading.
    """
    # General
    users_sort_users_by_first_name = ConfigVariable(
        name='users_sort_users_by_first_name',
        default_value=False,
        form_field=forms.BooleanField(
            required=False,
            label=ugettext_lazy('Sort users by first name'),
            help_text=ugettext_lazy('Disable for sorting by last name')))

    group_general = ConfigGroup(
        title=ugettext_lazy('Sorting'),
        variables=(users_sort_users_by_first_name,))

    # PDF
    users_pdf_welcometitle = ConfigVariable(
        name='users_pdf_welcometitle',
        default_value=_('Welcome to OpenSlides!'),
        translatable=True,
        form_field=forms.CharField(
            widget=forms.Textarea(),
            required=False,
            label=ugettext_lazy('Title for access data and welcome PDF')))

    users_pdf_welcometext = ConfigVariable(
        name='users_pdf_welcometext',
        default_value=_('[Place for your welcome and help text.]'),
        translatable=True,
        form_field=forms.CharField(
            widget=forms.Textarea(),
            required=False,
            label=ugettext_lazy('Help text for access data and welcome PDF')))

    users_pdf_url = ConfigVariable(
        name='users_pdf_url',
        default_value='http://example.com:8000',
        form_field=forms.CharField(
            widget=forms.TextInput(),
            required=False,
            label=ugettext_lazy('System URL'),
            help_text=ugettext_lazy('Used for QRCode in PDF of access data.')))

    users_pdf_wlan_ssid = ConfigVariable(
        name='users_pdf_wlan_ssid',
        default_value='',
        form_field=forms.CharField(
            widget=forms.TextInput(),
            required=False,
            label=ugettext_lazy('WLAN name (SSID)'),
            help_text=ugettext_lazy('Used for WLAN QRCode in PDF of access data.')))

    users_pdf_wlan_password = ConfigVariable(
        name='users_pdf_wlan_password',
        default_value='',
        form_field=forms.CharField(
            widget=forms.TextInput(),
            required=False,
            label=ugettext_lazy('WLAN password'),
            help_text=ugettext_lazy('Used for WLAN QRCode in PDF of access data.')))

    users_pdf_wlan_encryption = ConfigVariable(
        name='users_pdf_wlan_encryption',
        default_value='',
        form_field=forms.ChoiceField(
            widget=forms.Select(),
            required=False,
            label=ugettext_lazy('WLAN encryption'),
            help_text=ugettext_lazy('Used for WLAN QRCode in PDF of access data.'),
            choices=(
                ('', '---------'),
                ('WEP', 'WEP'),
                ('WPA', 'WPA/WPA2'),
                ('nopass', ugettext_lazy('No encryption')))))

    group_pdf = ConfigGroup(
        title=ugettext_lazy('PDF'),
        variables=(users_pdf_welcometitle,
                   users_pdf_welcometext,
                   users_pdf_url,
                   users_pdf_wlan_ssid,
                   users_pdf_wlan_password,
                   users_pdf_wlan_encryption))

    return ConfigGroupedCollection(
        title=ugettext_noop('Users'),
        url='users',
        weight=50,
        groups=(group_general, group_pdf))


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
        'agenda.can_manage_agenda',
        'agenda.can_see_agenda',
        'agenda.can_see_orga_items',
        'assignment.can_manage_assignments',
        'assignment.can_nominate_other',
        'assignment.can_nominate_self',
        'assignment.can_see_assignments',
        'config.can_manage',
        'core.can_manage_projector',
        'core.can_manage_tags',
        'core.can_see_dashboard',
        'core.can_see_projector',
        'core.can_use_chat',
        'mediafile.can_manage',
        'mediafile.can_see',
        'mediafile.can_upload',
        'motion.can_create_motion',
        'motion.can_manage_motion',
        'motion.can_see_motion',
        'motion.can_support_motion',
        'users.can_manage',
        'users.can_see_extra_data',
        'users.can_see_name', )
    permission_dict = {}
    permission_query = Q()

    for permission_string in permission_strings:
        app_label, codename = permission_string.split('.')
        query_part = Q(content_type__app_label=app_label) & Q(codename=codename)
        permission_query = permission_query | query_part
    for permission in Permission.objects.select_related('content_type').filter(permission_query):
        permission_string = '.'.join((permission.content_type.app_label, permission.codename))
        permission_dict[permission_string] = permission

    # Anonymous (pk 1) and Registered (pk 2)
    base_permissions = (
        permission_dict['agenda.can_see_agenda'],
        permission_dict['agenda.can_see_orga_items'],
        permission_dict['assignment.can_see_assignments'],
        permission_dict['core.can_see_dashboard'],
        permission_dict['core.can_see_projector'],
        permission_dict['mediafile.can_see'],
        permission_dict['motion.can_see_motion'],
        permission_dict['users.can_see_extra_data'],
        permission_dict['users.can_see_name'], )
    group_anonymous = Group.objects.create(name=ugettext_noop('Anonymous'), pk=1)
    group_anonymous.permissions.add(*base_permissions)
    group_registered = Group.objects.create(name=ugettext_noop('Registered'), pk=2)
    group_registered.permissions.add(
        permission_dict['agenda.can_be_speaker'],
        *base_permissions)

    # Delegates (pk 3)
    delegates_permissions = (
        permission_dict['assignment.can_nominate_other'],
        permission_dict['assignment.can_nominate_self'],
        permission_dict['mediafile.can_upload'],
        permission_dict['motion.can_create_motion'],
        permission_dict['motion.can_support_motion'], )
    group_delegates = Group.objects.create(name=ugettext_noop('Delegates'), pk=3)
    group_delegates.permissions.add(*delegates_permissions)

    # Staff (pk 4)
    staff_permissions = (
        permission_dict['agenda.can_manage_agenda'],
        permission_dict['assignment.can_manage_assignments'],
        permission_dict['assignment.can_nominate_other'],
        permission_dict['assignment.can_nominate_self'],
        permission_dict['config.can_manage'],
        permission_dict['core.can_manage_projector'],
        permission_dict['core.can_manage_tags'],
        permission_dict['core.can_use_chat'],
        permission_dict['mediafile.can_manage'],
        permission_dict['mediafile.can_upload'],
        permission_dict['motion.can_create_motion'],
        permission_dict['motion.can_manage_motion'],
        permission_dict['users.can_manage'], )
    group_staff = Group.objects.create(name=ugettext_noop('Staff'), pk=4)
    group_staff.permissions.add(*staff_permissions)

    # Add users.can_see_name and users.can_see_extra_data permissions
    # TODO: Remove this redundancy after cleanup of the permission system.
    group_staff.permissions.add(
        permission_dict['users.can_see_extra_data'],
        permission_dict['users.can_see_name'])

    # Admin user
    User.objects.create_or_reset_admin_user()
