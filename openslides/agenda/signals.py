#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.agenda.signals
    ~~~~~~~~~~~~~~~~~~~~~~~~~

    Signals for the agenda app.

    :copyright: (c) 2011-2013 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.dispatch import receiver

from openslides.config.signals import default_config_value


@receiver(default_config_value, dispatch_uid="agenda_default_config")
def default_config(sender, key, **kwargs):
    """Return the default config values for the agenda app."""
    return {
        'agenda_start_event_date_time': ''}.get(key)
