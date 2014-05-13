# -*- coding: utf-8 -*-
from time import time

from django.contrib.staticfiles.templatetags.staticfiles import static
from django.core.context_processors import csrf
from django.dispatch import receiver, Signal
from django.template.loader import render_to_string
from django.utils.datastructures import SortedDict

from openslides.config.api import config, ConfigCollection, ConfigVariable
from openslides.config.signals import config_signal

from .projector import Overlay

projector_overlays = Signal(providing_args=['request'])


@receiver(config_signal, dispatch_uid='setup_projector_config')
def setup_projector_config(sender, **kwargs):
    """
    Projector config variables for OpenSlides. They are not shown on a
    config view.
    """
    # The active slide. The config-value is a dictonary with at least the entry
    # 'callback'.
    projector = ConfigVariable(
        name='projector_active_slide',
        default_value={'callback': None})

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

    projector_scale = ConfigVariable(
        name='projector_scale',
        default_value=0)

    projector_scroll = ConfigVariable(
        name='projector_scroll',
        default_value=0)

    projector_js_cache = ConfigVariable(
        name='projector_js_cache',
        default_value={})

    projector_active_overlays = ConfigVariable(
        name='projector_active_overlays',
        default_value=[])

    projector_pdf_fullscreen = ConfigVariable(
        name='pdf_fullscreen',
        default_value=False)

    return ConfigCollection(
        variables=(
            projector, projector_message,
            countdown_time, countdown_start_stamp, countdown_pause_stamp,
            countdown_state, projector_scale, projector_scroll,
            projector_active_overlays, projector_js_cache,
            projector_pdf_fullscreen))


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
        value = SortedDict()
        value['load_file'] = static('js/countdown.js')
        value['projector_countdown_start'] = int(config['countdown_start_stamp'])
        value['projector_countdown_duration'] = int(config['countdown_time'])
        value['projector_countdown_pause'] = int(config['countdown_pause_stamp'])
        value['projector_countdown_state'] = config['countdown_state']
        value['call'] = 'update_countdown();'
        return value

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
        return {'load_file': static('js/clock.js'),
                'call': javascript}

    return Overlay(name, None, get_projector_html, get_projector_js,
                   allways_active=True)
