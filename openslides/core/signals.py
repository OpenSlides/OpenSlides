from django.core.validators import MaxLengthValidator
from django.dispatch import Signal
from django.utils.translation import ugettext as _
from django.utils.translation import ugettext_lazy

from openslides.core.config import ConfigVariable

# This signal is sent when the migrate command is done. That means it is sent
# after post_migrate sending and creating all Permission objects. Don't use it
# for other things than dealing with Permission objects.
post_permission_creation = Signal()


def setup_general_config(sender, **kwargs):
    """
    Receiver function to setup general config variables for OpenSlides.
    There are two main groups: 'General' and 'Projector'. The group
    'General' has subgroups. This function is connected to the signal
    openslides.core.signals.config_signal during app loading.
    """
    # General Event

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
        default_value=_('Presentation and assembly system'),
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

    # TODO: Check whether this variable is ever used.
    yield ConfigVariable(
        name='general_event_organizer',
        default_value='',
        label=ugettext_lazy('Event organizer'),
        weight=130,
        group=ugettext_lazy('General'),
        subgroup=ugettext_lazy('Event'))

    # General System

    yield ConfigVariable(
        name='general_system_enable_anonymous',
        default_value=False,
        input_type='boolean',
        label=ugettext_lazy('Allow access for anonymous guest users'),
        weight=135,
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
        name='projector_backgroundcolor1',
        default_value='#444444',
        label=ugettext_lazy('Background color of projector header'),
        help_text=ugettext_lazy('Use web color names like "red" or hex numbers like "#ff0000".'),
        weight=160,
        group=ugettext_lazy('Projector'))

    yield ConfigVariable(
        name='projector_backgroundcolor2',
        default_value='#222222',
        label=ugettext_lazy('Second (optional) background color for linear color gradient'),
        help_text=ugettext_lazy('Use web color names like "red" or hex numbers like "#ff0000".'),
        weight=165,
        group=ugettext_lazy('Projector'))

    yield ConfigVariable(
        name='projector_fontcolor',
        default_value='#F5F5F5',
        label=ugettext_lazy('Font color of projector header'),
        help_text=ugettext_lazy('Use web color names like "red" or hex numbers like "#ff0000".'),
        weight=170,
        group=ugettext_lazy('Projector'))

    yield ConfigVariable(
        name='projector_welcome_title',
        default_value=_('Welcome to OpenSlides'),
        label=ugettext_lazy('Title'),
        help_text=ugettext_lazy('Also used for the default welcome slide.'),
        weight=175,
        group=ugettext_lazy('Projector'),
        translatable=True)

    yield ConfigVariable(
        name='projector_welcome_text',
        default_value=_('[Space for your welcome text.]'),
        label=ugettext_lazy('Welcome text'),
        weight=180,
        group=ugettext_lazy('Projector'),
        translatable=True)

    yield ConfigVariable(
        name='projector_default_countdown',
        default_value=60,
        label=ugettext_lazy('Default countdown'),
        weight=185,
        group=ugettext_lazy('Projector'))


config_signal = Signal(providing_args=[])
"""Signal to get all config tabs from all apps."""
