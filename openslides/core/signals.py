#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.core.signals
    ~~~~~~~~~~~~~~~~~~~~~~~

    Signals for the core app.

    :copyright: (c) 2011–2013 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.dispatch import Signal, receiver
from django import forms
from django.utils.translation import ugettext as _, ugettext_lazy, ugettext_noop

from openslides.config.signals import config_signal
from openslides.config.api import ConfigVariable, ConfigGroup, ConfigGroupedPage


post_database_setup = Signal()


@receiver(config_signal, dispatch_uid='setup_general_config_page')
def setup_general_config_page(sender, **kwargs):
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

    welcome_title = ConfigVariable(
        name='welcome_title',
        default_value=_('Welcome to OpenSlides'),
        form_field=forms.CharField(
            widget=forms.TextInput(),
            label=ugettext_lazy('Title'),
            required=False))

    welcome_text = ConfigVariable(
        name='welcome_text',
        default_value=_('[Place for your welcome text.]'),
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

    group_welcome_widget = ConfigGroup(
        title=ugettext_lazy('Welcome Widget'),
        variables=(welcome_title, welcome_text))

    group_system = ConfigGroup(
        title=ugettext_lazy('System'),
        variables=(system_enable_anonymous,))

    return ConfigGroupedPage(
        title=ugettext_noop('General'),
        url='general',
        required_permission='config.can_manage',
        weight=10,
        groups=(group_event, group_welcome_widget, group_system))
