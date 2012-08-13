#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.utils.user.signals
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Defines Signals for the user.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.dispatch import Signal

receive_persons = Signal(providing_args=['person_prefix_filter', 'id_filter'])
