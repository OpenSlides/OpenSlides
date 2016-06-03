from django.utils.translation import ugettext as _
from django.utils.translation import ugettext_lazy

from openslides.core.config import ConfigVariable


def get_config_variables():
    """
    Generator which yields all config variables of this app.

    They are grouped in 'Sorting' and 'PDF'. The generator has to be evaluated
    during app loading (see apps.py).
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
