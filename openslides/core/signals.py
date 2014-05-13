# -*- coding: utf-8 -*-

from django import forms
from django.dispatch import receiver, Signal
from django.utils.translation import ugettext as _
from django.utils.translation import ugettext_lazy, ugettext_noop

from openslides.config.api import ConfigGroup, ConfigGroupedCollection, ConfigVariable
from openslides.config.signals import config_signal
from openslides.projector.api import update_projector

post_database_setup = Signal()


@receiver(config_signal, dispatch_uid='setup_general_config')
def setup_general_config(sender, **kwargs):
    """
    General config variables for OpenSlides. They are grouped in 'Event',
    'Welcome Widget' and 'System'.
    """
    event_name = ConfigVariable(
        name='event_name',
        default_value='OpenSlides',
        form_field=forms.CharField(
            widget=forms.TextInput(),
            label=ugettext_lazy('Event name'),
            max_length=50))

    event_description = ConfigVariable(
        name='event_description',
        default_value=_('Presentation and assembly system'),
        translatable=True,
        form_field=forms.CharField(
            widget=forms.TextInput(),
            label=ugettext_lazy('Short description of event'),
            required=False,
            max_length=100))

    event_date = ConfigVariable(
        name='event_date',
        default_value='',
        form_field=forms.CharField(
            widget=forms.TextInput(),
            label=ugettext_lazy('Event date'),
            required=False))

    event_location = ConfigVariable(
        name='event_location',
        default_value='',
        form_field=forms.CharField(
            widget=forms.TextInput(),
            label=ugettext_lazy('Event location'),
            required=False))

    event_organizer = ConfigVariable(
        name='event_organizer',
        default_value='',
        form_field=forms.CharField(
            widget=forms.TextInput(),
            label=ugettext_lazy('Event organizer'),
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

    welcome_title = ConfigVariable(
        name='welcome_title',
        default_value=_('Welcome to OpenSlides'),
        translatable=True,
        form_field=forms.CharField(
            widget=forms.TextInput(),
            label=ugettext_lazy('Title'),
            help_text=ugettext_lazy('Also used for the default welcome slide.'),
            required=False),
        on_change=update_projector)

    welcome_text = ConfigVariable(
        name='welcome_text',
        default_value=_('[Place for your welcome text.]'),
        translatable=True,
        form_field=forms.CharField(
            widget=forms.Textarea(),
            label=ugettext_lazy('Welcome text'),
            required=False))

    system_enable_anonymous = ConfigVariable(
        name='system_enable_anonymous',
        default_value=False,
        form_field=forms.BooleanField(
            label=ugettext_lazy('Allow access for anonymous guest users'),
            required=False))

    group_event = ConfigGroup(
        title=ugettext_lazy('Event'),
        variables=(event_name, event_description, event_date, event_location, event_organizer))

    group_projector = ConfigGroup(
        title=ugettext_lazy('Projector'),
        variables=(projector_enable_logo, projector_enable_title, projector_backgroundcolor1, projector_backgroundcolor2, projector_fontcolor))

    group_welcome_widget = ConfigGroup(
        title=ugettext_lazy('Welcome Widget'),
        variables=(welcome_title, welcome_text))

    group_system = ConfigGroup(
        title=ugettext_lazy('System'),
        variables=(system_enable_anonymous,))

    return ConfigGroupedCollection(
        title=ugettext_noop('General'),
        url='general',
        weight=10,
        groups=(group_event, group_projector, group_welcome_widget, group_system))
