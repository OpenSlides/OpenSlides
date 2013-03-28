#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.projector.signals
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Signals for the projector app.

    :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.dispatch import Signal, receiver
from django import forms
from django.utils.translation import ugettext_lazy, ugettext as _

from openslides.config.signals import config_signal
from openslides.config.api import ConfigVariable, ConfigPage


projector_overlays = Signal(providing_args=['register', 'call'])


@receiver(config_signal, dispatch_uid='setup_projector_config_variables')
def setup_projector_config_variables(sender, **kwargs):
    """
    Projector config variables for OpenSlides. They are not shown on a
    config page.
    """

    presentation = ConfigVariable(
        name='presentation',
        default_value='')

    presentation_argument = ConfigVariable(
        name='presentation_argument',
        default_value=None)

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

    return ConfigPage(title='No title here',
                      url='bar',
                      required_permission=None,
                      variables=(presentation, presentation_argument, projector_message, countdown_time,
                                 countdown_start_stamp, countdown_pause_stamp, countdown_state, bigger, up))
