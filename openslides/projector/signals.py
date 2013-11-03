# -*- coding: utf-8 -*-
from time import time

from django.contrib.staticfiles.templatetags.staticfiles import static
from django.core.context_processors import csrf
from django.dispatch import receiver, Signal
from django.template.loader import render_to_string

from openslides.config.api import config

from .projector import Overlay

projector_overlays = Signal(providing_args=['request'])


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
            'call': 'update_countdown();',
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


@receiver(projector_overlays, dispatch_uid="projector_overlay_message")
def projector_overlay_message(sender, **kwargs):
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
        javascript = 'projector.set_server_time(%d);update_clock();' % int(time())
        return {'load_file': static('javascript/clock.js'),
                'call': javascript}

    return Overlay(name, None, get_projector_html, get_projector_js,
                   allways_active=True)
