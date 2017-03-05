from django.core.validators import MaxLengthValidator

from openslides.core.config import ConfigVariable


def get_config_variables():
    """
    Generator which yields all config variables of this app.

    There are two main groups: 'General' and 'Projector'. The group 'General'
    has subgroups. The generator has to be evaluated during app loading
    (see apps.py).
    """
    yield ConfigVariable(
        name='general_event_name',
        default_value='OpenSlides',
        label='Event name',
        weight=110,
        group='General',
        subgroup='Event',
        validators=(MaxLengthValidator(100),))

    yield ConfigVariable(
        name='general_event_description',
        default_value='Presentation and assembly system',
        label='Short description of event',
        weight=115,
        group='General',
        subgroup='Event',
        validators=(MaxLengthValidator(100),),
        translatable=True)

    yield ConfigVariable(
        name='general_event_date',
        default_value='',
        label='Event date',
        weight=120,
        group='General',
        subgroup='Event')

    yield ConfigVariable(
        name='general_event_location',
        default_value='',
        label='Event location',
        weight=125,
        group='General',
        subgroup='Event')

    yield ConfigVariable(
        name='general_event_organizer',
        default_value='',
        label='Event organizer',
        weight=130,
        group='General',
        subgroup='Event')

    yield ConfigVariable(
        name='general_event_legal_notice',
        default_value='<a href="http://www.openslides.org">OpenSlides</a> is a '
                      'free web based presentation and assembly system for '
                      'visualizing and controlling agenda, motions and '
                      'elections of an assembly.',
        input_type='markupText',
        label='Legal notice',
        weight=132,
        group='General',
        subgroup='Event',
        translatable=True)

    yield ConfigVariable(
        name='general_event_welcome_title',
        default_value='Welcome to OpenSlides',
        label='Front page title',
        weight=134,
        group='General',
        subgroup='Event',
        translatable=True)

    yield ConfigVariable(
        name='general_event_welcome_text',
        default_value='[Space for your welcome text.]',
        input_type='markupText',
        label='Front page text',
        weight=136,
        group='General',
        subgroup='Event',
        translatable=True)

    # General System

    yield ConfigVariable(
        name='general_system_enable_anonymous',
        default_value=False,
        input_type='boolean',
        label='Allow access for anonymous guest users',
        weight=138,
        group='General',
        subgroup='System')

    yield ConfigVariable(
        name='general_login_info_text',
        default_value='',
        label='Show this text on the login page',
        weight=140,
        group='General',
        subgroup='System')

    # CSV

    yield ConfigVariable(
        name='general_csv_separator',
        default_value=',',
        label='Separator used for all csv exports and examples',
        weight=144,
        group='General',
        subgroup='CSV')

    # Projector

    yield ConfigVariable(
        name='projector_language',
        default_value='browser',
        input_type='choice',
        label='Projector language',
        choices=(
            {'value': 'browser', 'display_name': 'Current browser language'},
            {'value': 'en', 'display_name': 'English'},
            {'value': 'de', 'display_name': 'Deutsch'},
            {'value': 'fr', 'display_name': 'Français'},
            {'value': 'es', 'display_name': 'Español'},
            {'value': 'pt', 'display_name': 'Português'},
            {'value': 'cs', 'display_name': 'Čeština'},
            {'value': 'ru', 'display_name': 'русский'}),
        weight=148,
        group='Projector')

    yield ConfigVariable(
        name='projector_enable_logo',
        default_value=True,
        input_type='boolean',
        label='Show logo on projector',
        help_text='You can replace the logo. Just copy a file to '
                  '"static/img/logo-projector.png" in your OpenSlides data path.',
        weight=150,
        group='Projector')

    yield ConfigVariable(
        name='projector_enable_title',
        default_value=True,
        input_type='boolean',
        label='Show title and description of event on projector',
        weight=155,
        group='Projector')

    yield ConfigVariable(
        name='projector_header_backgroundcolor',
        default_value='#317796',
        input_type='colorpicker',
        label='Background color of projector header and footer',
        weight=160,
        group='Projector')

    yield ConfigVariable(
        name='projector_header_fontcolor',
        default_value='#F5F5F5',
        input_type='colorpicker',
        label='Font color of projector header and footer',
        weight=165,
        group='Projector')

    yield ConfigVariable(
        name='projector_h1_fontcolor',
        default_value='#317796',
        input_type='colorpicker',
        label='Font color of projector headline',
        weight=170,
        group='Projector')

    yield ConfigVariable(
        name='projector_default_countdown',
        default_value=60,
        input_type='integer',
        label='Predefined seconds of new countdowns',
        weight=185,
        group='Projector')

    yield ConfigVariable(
        name='projector_blank_color',
        default_value='#FFFFFF',
        input_type='colorpicker',
        label='Color for blanked projector',
        weight=190,
        group='Projector')

    yield ConfigVariable(
        name='projector_broadcast',
        default_value=0,
        input_type='integer',
        label='Projector which is broadcasted',
        weight=200,
        group='Projector',
        hidden=True)

    yield ConfigVariable(
        name='projector_currentListOfSpeakers_reference',
        default_value=1,
        input_type='integer',
        label='Projector reference for list of speakers',
        weight=201,
        group='Projector',
        hidden=True)
