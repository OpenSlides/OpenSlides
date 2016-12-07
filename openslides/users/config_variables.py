from openslides.core.config import ConfigVariable


def get_config_variables():
    """
    Generator which yields all config variables of this app.

    They are grouped in 'Sorting' and 'PDF'. The generator has to be evaluated
    during app loading (see apps.py).
    """
    # Sorting
    yield ConfigVariable(
        name='users_sort_by',
        default_value='first_name',
        input_type='choice',
        label='Sort name of participants by',
        choices=(
            {'value': 'first_name', 'display_name': 'Given name'},
            {'value': 'last_name', 'display_name': 'Surname'}),
        weight=510,
        group='Participants',
        subgroup='General')

    # PDF

    yield ConfigVariable(
        name='users_pdf_welcometitle',
        default_value='Welcome to OpenSlides',
        label='Title for access data and welcome PDF',
        weight=520,
        group='Participants',
        subgroup='PDF',
        translatable=True)

    yield ConfigVariable(
        name='users_pdf_welcometext',
        default_value='[Place for your welcome and help text.]',
        label='Help text for access data and welcome PDF',
        weight=530,
        group='Participants',
        subgroup='PDF',
        translatable=True)

    # TODO: Use Django's URLValidator here.
    yield ConfigVariable(
        name='users_pdf_url',
        default_value='http://example.com:8000',
        label='System URL',
        help_text='Used for QRCode in PDF of access data.',
        weight=540,
        group='Participants',
        subgroup='PDF')

    yield ConfigVariable(
        name='users_pdf_wlan_ssid',
        default_value='',
        label='WLAN name (SSID)',
        help_text='Used for WLAN QRCode in PDF of access data.',
        weight=550,
        group='Participants',
        subgroup='PDF')

    yield ConfigVariable(
        name='users_pdf_wlan_password',
        default_value='',
        label='WLAN password',
        help_text='Used for WLAN QRCode in PDF of access data.',
        weight=560,
        group='Participants',
        subgroup='PDF')

    yield ConfigVariable(
        name='users_pdf_wlan_encryption',
        default_value='',
        input_type='choice',
        label='WLAN encryption',
        help_text='Used for WLAN QRCode in PDF of access data.',
        choices=(
            {'value': '', 'display_name': '---------'},
            {'value': 'WEP', 'display_name': 'WEP'},
            {'value': 'WPA', 'display_name': 'WPA/WPA2'},
            {'value': 'nopass', 'display_name': 'No encryption'}),
        weight=570,
        group='Participants',
        subgroup='PDF')
