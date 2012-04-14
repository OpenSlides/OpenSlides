#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.projector.signals
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Defines Signals for the projector.

    :copyright: 2011 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.dispatch import Signal

projector_messages = Signal(providing_args=['register', 'call'])

projector_control_box = Signal()
