#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.agenda.signals
    ~~~~~~~~~~~~~~~~~~~~~~~~~

    Signals for the agenda app.

    :copyright: (c) 2011–2013 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.dispatch import receiver
from django import forms
from django.utils.translation import ugettext_lazy, ugettext_noop, ugettext as _
from django.template.loader import render_to_string

from openslides.config.signals import config_signal
from openslides.config.api import config, ConfigVariable, ConfigPage

from openslides.projector.signals import projector_overlays
from openslides.projector.projector import Overlay
from openslides.projector.api import (get_active_slide, get_slide_from_sid,
                                      clear_projector_cache)

from .models import Speaker, Item


# TODO: Reinsert the datepicker scripts in the template

@receiver(config_signal, dispatch_uid='setup_agenda_config_page')
def setup_agenda_config_page(sender, **kwargs):
    """
    Agenda config variables.
    """
    # TODO: Insert validator for the format or use other field carefully.
    agenda_start_event_date_time = ConfigVariable(
        name='agenda_start_event_date_time',
        default_value='',
        form_field=forms.CharField(
            widget=forms.DateTimeInput(format='%d.%m.%Y %H:%M'),
            required=False,
            label=_('Begin of event'),
            help_text=_('Input format: DD.MM.YYYY HH:MM')))

    agenda_show_last_speakers = ConfigVariable(
        name='agenda_show_last_speakers',
        default_value=1,
        form_field=forms.IntegerField(
            min_value=0,
            label=_('Number of last speakers to be shown on the projector')))

    extra_stylefiles = ['styles/timepicker.css', 'styles/jquery-ui/jquery-ui.custom.min.css']
    extra_javascript = ['javascript/jquery-ui.custom.min.js',
                        'javascript/jquery-ui-timepicker-addon.min.js',
                        'javascript/jquery-ui-sliderAccess.min.js',
                        'javascript/agenda-config-datepicker.js']

    return ConfigPage(title=ugettext_noop('Agenda'),
                      url='agenda',
                      required_permission='config.can_manage',
                      weight=20,
                      variables=(agenda_start_event_date_time, agenda_show_last_speakers),
                      extra_context={'extra_stylefiles': extra_stylefiles,
                                     'extra_javascript': extra_javascript})


@receiver(projector_overlays, dispatch_uid="agenda_list_of_speakers")
def agenda_list_of_speakers(sender, **kwargs):
    """
    Receiver for the list of speaker overlay.
    """
    name = 'agenda_speaker'

    def get_widget_html():
        """
        Returns the the html-code to show in the overly-widget.
        """
        return render_to_string('agenda/overlay_speaker_widget.html')

    def get_projector_html():
        """
        Returns an html-code to show on the projector.
        """
        slide = get_slide_from_sid(get_active_slide(only_sid=True), element=True)
        if not isinstance(slide, Item):
            # Only show list of speakers overlay on agenda items
            return None
        if config['presentation_argument'] == 'show_list_of_speakers':
            # Do not show list of speakers overlay on the list of speakers slide
            return None
        clear_projector_cache()
        list_of_speakers = slide.get_list_of_speakers(
            old_speakers_count=config['agenda_show_last_speakers'],
            coming_speakers_count=5)
        context = {'list_of_speakers': list_of_speakers}
        return render_to_string('agenda/overlay_speaker_projector.html', context)

    return Overlay(name, get_widget_html, get_projector_html)
