#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.config.signals
    ~~~~~~~~~~~~~~~~~~~~~~~~~

    Signals for the config app.

    :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.dispatch import Signal


config_signal = Signal(providing_args=[])
"""Signal to get all config tabs from all apps."""
