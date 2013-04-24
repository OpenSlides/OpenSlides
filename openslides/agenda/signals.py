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
from django.utils.translation import ugettext_lazy, ugettext_noop
from django.template.loader import render_to_string

from openslides.config.signals import config_signal
from openslides.config.api import ConfigVariable, ConfigPage

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
            label=ugettext_lazy('Begin of event'),
            help_text=ugettext_lazy('Input format: DD.MM.YYYY HH:MM')))

    extra_stylefiles = ['styles/timepicker.css', 'styles/jquery-ui/jquery-ui.custom.min.css']
    extra_javascript = ['javascript/jquery-ui.custom.min.js',
                        'javascript/jquery-ui-timepicker-addon.min.js',
                        'javascript/jquery-ui-sliderAccess.min.js',
                        'javascript/agenda-config-datepicker.js']

    return ConfigPage(title=ugettext_noop('Agenda'),
                      url='agenda',
                      required_permission='config.can_manage',
                      weight=20,
                      variables=(agenda_start_event_date_time,),
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
            # Only show list of speakers on Agenda-Items
            return None
        clear_projector_cache()
        speakers = Speaker.objects.filter(time=None, item=slide)[:5]
        context = {'speakers': speakers}
        return render_to_string('agenda/overlay_speaker_projector.html', context)

    return Overlay(name, get_widget_html, get_projector_html)
