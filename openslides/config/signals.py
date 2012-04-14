#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.config.signals
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Defines Signals for the config.

    :copyright: 2011 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.dispatch import Signal

default_config_value = Signal(providing_args=['key'])
