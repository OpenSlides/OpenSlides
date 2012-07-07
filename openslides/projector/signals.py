#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.projector.signals
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Defines Signals for the projector.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.dispatch import Signal

projector_overlays = Signal(providing_args=['register', 'call'])
