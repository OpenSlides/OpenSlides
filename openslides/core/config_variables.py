from django.core.validators import MaxLengthValidator
from django.utils.translation import ugettext_lazy

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
        label=ugettext_lazy('Event name'),
        weight=110,
        group=ugettext_lazy('General'),
        subgroup=ugettext_lazy('Event'),
        validators=(MaxLengthValidator(50),))

    yield ConfigVariable(
        name='general_event_description',
        default_value=ugettext_lazy('Presentation and assembly system'),
        label=ugettext_lazy('Short description of event'),
        weight=115,
        group=ugettext_lazy('General'),
        subgroup=ugettext_lazy('Event'),
        validators=(MaxLengthValidator(100),),
        translatable=True)

    yield ConfigVariable(
        name='general_event_date',
        default_value='',
        label=ugettext_lazy('Event date'),
        weight=120,
        group=ugettext_lazy('General'),
        subgroup=ugettext_lazy('Event'))

    yield ConfigVariable(
        name='general_event_location',
        default_value='',
        label=ugettext_lazy('Event location'),
        weight=125,
        group=ugettext_lazy('General'),
        subgroup=ugettext_lazy('Event'))

    yield ConfigVariable(
        name='general_event_organizer',
        default_value='',
        label=ugettext_lazy('Event organizer'),
        weight=130,
        group=ugettext_lazy('General'),
        subgroup=ugettext_lazy('Event'))

    yield ConfigVariable(
        name='general_event_legal_notice',
        default_value=ugettext_lazy(
            '<a href="http://www.openslides.org">OpenSlides</a> is a free web based '
            'presentation and assembly system for visualizing and controlling agenda, '
            'motions and elections of an assembly.'),
        input_type='text',
        label=ugettext_lazy('Legal notice'),
        weight=132,
        group=ugettext_lazy('General'),
        subgroup=ugettext_lazy('Event'),
        translatable=True)

    yield ConfigVariable(
        name='general_event_welcome_title',
        default_value=ugettext_lazy('Welcome to OpenSlides'),
        label=ugettext_lazy('Front page title'),
        weight=134,
        group=ugettext_lazy('General'),
        subgroup=ugettext_lazy('Event'),
        translatable=True)

    yield ConfigVariable(
        name='general_event_welcome_text',
        default_value=ugettext_lazy('[Space for your welcome text.]'),
        input_type='text',
        label=ugettext_lazy('Front page text'),
        weight=136,
        group=ugettext_lazy('General'),
        subgroup=ugettext_lazy('Event'),
        translatable=True)

    # General System

    yield ConfigVariable(
        name='general_system_enable_anonymous',
        default_value=False,
        input_type='boolean',
        label=ugettext_lazy('Allow access for anonymous guest users'),
        weight=138,
        group=ugettext_lazy('General'),
        subgroup=ugettext_lazy('System'))

    yield ConfigVariable(
        name='general_login_info_text',
        default_value='',
        label=ugettext_lazy('Show this text on the login page.'),
        weight=140,
        group=ugettext_lazy('General'),
        subgroup=ugettext_lazy('System'))

    # Projector

    yield ConfigVariable(
        name='projector_enable_logo',
        default_value=True,
        input_type='boolean',
        label=ugettext_lazy('Show logo on projector'),
        help_text=ugettext_lazy(
            'You can replace the logo. Just copy a file to '
            '"static/img/logo-projector.png" in your OpenSlides data path.'),
        weight=150,
        group=ugettext_lazy('Projector'))

    yield ConfigVariable(
        name='projector_enable_title',
        default_value=True,
        input_type='boolean',
        label=ugettext_lazy('Show title and description of event on projector'),
        weight=155,
        group=ugettext_lazy('Projector'))

    yield ConfigVariable(
        name='projector_header_backgroundcolor',
        default_value='#317796',
        input_type='colorpicker',
        label=ugettext_lazy('Background color of projector header and footer'),
        weight=160,
        group=ugettext_lazy('Projector'))

    yield ConfigVariable(
        name='projector_header_fontcolor',
        default_value='#F5F5F5',
        input_type='colorpicker',
        label=ugettext_lazy('Font color of projector header and footer'),
        weight=165,
        group=ugettext_lazy('Projector'))

    yield ConfigVariable(
        name='projector_h1_fontcolor',
        default_value='#317796',
        input_type='colorpicker',
        label=ugettext_lazy('Font color of projector headline'),
        weight=170,
        group=ugettext_lazy('Projector'))

    yield ConfigVariable(
        name='projector_default_countdown',
        default_value=60,
        label=ugettext_lazy('Default countdown'),
        weight=185,
        group=ugettext_lazy('Projector'))
