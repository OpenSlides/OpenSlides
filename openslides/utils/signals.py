#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.utils.signals
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Defines Signals for the openslides-project.

    :copyright: 2011 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.dispatch import Signal

template_manipulation = Signal(providing_args=['context'])
