from django import forms
from django.utils.translation import ugettext as _
from django.utils.translation import ugettext_lazy, ugettext_noop

from openslides.config.api import ConfigGroup, ConfigGroupedCollection, ConfigVariable


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


def user_post_save(sender, instance, *args, **kwargs):
    """
    Receiver function to add a new user to the registered group. It is
    connected to the signal django.db.models.signals.post_save during app
    loading.
    """
    if not kwargs['created']:
        return

    from openslides.users.api import get_registered_group  # TODO: Test, if global import is possible
    registered = get_registered_group()
    instance.groups.add(registered)
    instance.save()
