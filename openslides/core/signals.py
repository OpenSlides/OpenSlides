from django import forms
from django.dispatch import Signal
from django.utils.translation import ugettext as _
from django.utils.translation import ugettext_lazy, ugettext_noop

from openslides.config.api import (
    ConfigGroup,
    ConfigGroupedCollection,
    ConfigVariable,
)

# This signal is sent when the migrate command is done. That means it is sent
# after post_migrate sending and creating all Permission objects. Don't use it
# for other things than dealing with Permission objects.
post_permission_creation = Signal()


def setup_general_config(sender, **kwargs):
    """
    Receiver function to setup general config variables for OpenSlides.
    They are grouped in 'Event', 'Projector' and 'System'. This function is
    connected to the signal openslides.config.signals.config_signal during
    app loading.
    """
    general_event_name = ConfigVariable(
        name='general_event_name',
        default_value='OpenSlides',
        form_field=forms.CharField(
            widget=forms.TextInput(),
            label=ugettext_lazy('Event name'),
            max_length=50))

    general_event_description = ConfigVariable(
        name='general_event_description',
        default_value=_('Presentation and assembly system'),
        translatable=True,
        form_field=forms.CharField(
            widget=forms.TextInput(),
            label=ugettext_lazy('Short description of event'),
            required=False,
            max_length=100))

    general_event_date = ConfigVariable(
        name='general_event_date',
        default_value='',
        form_field=forms.CharField(
            widget=forms.TextInput(),
            label=ugettext_lazy('Event date'),
            required=False))

    general_event_location = ConfigVariable(
        name='general_event_location',
        default_value='',
        form_field=forms.CharField(
            widget=forms.TextInput(),
            label=ugettext_lazy('Event location'),
            required=False))

    # TODO: Check whether this variable is ever used.
    general_event_organizer = ConfigVariable(
        name='general_event_organizer',
        default_value='',
        form_field=forms.CharField(
            widget=forms.TextInput(),
            label=ugettext_lazy('Event organizer'),
            required=False))

    general_system_enable_anonymous = ConfigVariable(
        name='general_system_enable_anonymous',
        default_value=False,
        form_field=forms.BooleanField(
            label=ugettext_lazy('Allow access for anonymous guest users'),
            required=False))

    projector_enable_logo = ConfigVariable(
        name='projector_enable_logo',
        default_value=True,
        form_field=forms.BooleanField(
            label=ugettext_lazy('Show logo on projector'),
            help_text=ugettext_lazy('You can find and replace the logo under "openslides/projector/static/img/logo-projector.png".'),
            required=False))

    projector_enable_title = ConfigVariable(
        name='projector_enable_title',
        default_value=True,
        form_field=forms.BooleanField(
            label=ugettext_lazy('Show title and description of event on projector'),
            required=False))

    projector_backgroundcolor1 = ConfigVariable(
        name='projector_backgroundcolor1',
        default_value='#444444',
        form_field=forms.CharField(
            widget=forms.TextInput(),
            label=ugettext_lazy('Background color of projector header'),
            help_text=ugettext_lazy('Use web color names like "red" or hex numbers like "#ff0000".'),
            required=True))

    projector_backgroundcolor2 = ConfigVariable(
        name='projector_backgroundcolor2',
        default_value='#222222',
        form_field=forms.CharField(
            widget=forms.TextInput(),
            label=ugettext_lazy('Second (optional) background color for linear color gradient'),
            help_text=ugettext_lazy('Use web color names like "red" or hex numbers like "#ff0000".'),
            required=False))

    projector_fontcolor = ConfigVariable(
        name='projector_fontcolor',
        default_value='#F5F5F5',
        form_field=forms.CharField(
            widget=forms.TextInput(),
            label=ugettext_lazy('Font color of projector header'),
            help_text=ugettext_lazy('Use web color names like "red" or hex numbers like "#ff0000".'),
            required=True))

    projector_welcome_title = ConfigVariable(
        name='projector_welcome_title',
        default_value=_('Welcome to OpenSlides'),
        translatable=True,
        form_field=forms.CharField(
            widget=forms.TextInput(),
            label=ugettext_lazy('Title'),
            help_text=ugettext_lazy('Also used for the default welcome slide.'),
            required=False))

    projector_welcome_text = ConfigVariable(
        name='projector_welcome_text',
        default_value=_('[Place for your welcome text.]'),
        translatable=True,
        form_field=forms.CharField(
            widget=forms.Textarea(),
            label=ugettext_lazy('Welcome text'),
            required=False))

    group_event = ConfigGroup(
        title=ugettext_lazy('Event'),
        variables=(
            general_event_name,
            general_event_description,
            general_event_date,
            general_event_location,
            general_event_organizer))

    group_system = ConfigGroup(
        title=ugettext_lazy('System'),
        variables=(general_system_enable_anonymous,))

    group_projector = ConfigGroup(
        title=ugettext_lazy('Projector'),
        variables=(
            projector_enable_logo,
            projector_enable_title,
            projector_backgroundcolor1,
            projector_backgroundcolor2,
            projector_fontcolor,
            projector_welcome_title,
            projector_welcome_text))

    return ConfigGroupedCollection(
        title=ugettext_noop('General'),
        url='general',
        weight=10,
        groups=(group_event, group_system, group_projector))
