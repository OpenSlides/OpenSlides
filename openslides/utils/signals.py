#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.utils.signals
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Defines Signals for OpenSlides.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.dispatch import Signal

template_manipulation = Signal(providing_args=['request', 'context'])
