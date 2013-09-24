#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.projector.signals
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Signals for the projector app.

    :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""
from time import time

from django.dispatch import Signal, receiver
from django import forms
from django.template.loader import render_to_string
from django.core.context_processors import csrf
from django.contrib.staticfiles.templatetags.staticfiles import static

from openslides.config.api import config, ConfigVariable, ConfigPage
from openslides.config.signals import config_signal

from .projector import Overlay


projector_overlays = Signal(providing_args=['request'])


@receiver(config_signal, dispatch_uid='setup_projector_config_variables')
def setup_projector_config_variables(sender, **kwargs):
    """
    Projector config variables for OpenSlides. They are not shown on a
    config page.
    """

    projector = ConfigVariable(
        name='projector_active_slide',
        default_value={'callback': None})
    """
    The active slide. The config-value is a dictonary with at least the entrie
    'callback'.
    """

    projector_message = ConfigVariable(
        name='projector_message',
        default_value='')

    countdown_time = ConfigVariable(
        name='countdown_time',
        default_value=60)

    countdown_start_stamp = ConfigVariable(
        name='countdown_start_stamp',
        default_value=0)

    countdown_pause_stamp = ConfigVariable(
        name='countdown_pause_stamp',
        default_value=0)

    countdown_state = ConfigVariable(
        name='countdown_state',
        default_value='inactive')

    bigger = ConfigVariable(
        name='bigger',
        default_value=100)

    up = ConfigVariable(
        name='up',
        default_value=0)

    projector_active_overlays = ConfigVariable(
        name='projector_active_overlays',
        default_value=[])

    return ConfigPage(
        title='No title here', url='bar', required_permission=None, variables=(
            projector, projector_message,
            countdown_time, countdown_start_stamp, countdown_pause_stamp,
            countdown_state, bigger, up, projector_active_overlays))


@receiver(projector_overlays, dispatch_uid="projector_countdown")
def countdown(sender, **kwargs):
    """
    Receiver for the countdown.
    """
    name = 'projector_countdown'
    request = kwargs.get('request', None)

    def get_widget_html():
        """
        Returns the the html-code to show in the overly-widget.
        """
        context = {
            'countdown_time': config['countdown_time'],
            'countdown_state': config['countdown_state']}
        context.update(csrf(request))
        return render_to_string('projector/overlay_countdown_widget.html',
                                context)

    def get_projector_js():
        """
        Returns JavaScript for the projector
        """
        start = int(config['countdown_start_stamp'])
        duration = int(config['countdown_time'])
        pause = int(config['countdown_pause_stamp'])
        state = config['countdown_state']

        return {
            'load_file': static('javascript/countdown.js'),
            'projector_countdown_start': start,
            'projector_countdown_duration': duration,
            'projector_countdown_pause': pause,
            'projector_countdown_state': state}

    def get_projector_html():
        """
        Returns an html-code to show on the projector.
        """
        return render_to_string('projector/overlay_countdown_projector.html')

    return Overlay(name, get_widget_html, get_projector_html, get_projector_js)


@receiver(projector_overlays, dispatch_uid="projector_message")
def projector_message(sender, **kwargs):
    """
    Receiver to show the overlay_message on the projector or the form in the
    overlay-widget on the dashboard.
    """
    name = 'projector_message'
    request = kwargs.get('request', None)

    def get_widget_html():
        """
        Returns the the html-code to show in the overly-widget.
        """
        return render_to_string('projector/overlay_message_widget.html', csrf(request))

    def get_projector_html():
        """
        Returns an html-code to show on the projector.
        """
        if config['projector_message']:
            return render_to_string('projector/overlay_message_projector.html',
                                    {'message': config['projector_message']})
        return None

    return Overlay(name, get_widget_html, get_projector_html)


@receiver(projector_overlays, dispatch_uid="projector_clock")
def projector_clock(sender, **kwargs):
    """
    Receiver to show the clock on the projector.
    """
    name = 'projector_clock'

    def get_projector_html():
        """
        Returns the html-code for the clock.
        """
        return render_to_string('projector/overlay_clock_projector.html')

    def get_projector_js():
        """
        Returns JavaScript for the projector
        """
        return {'load_file': static('javascript/clock.js')}

    return Overlay(name, None, get_projector_html, get_projector_js,
                   allways_active=True)
