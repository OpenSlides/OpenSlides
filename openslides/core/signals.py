#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.core.signals
    ~~~~~~~~~~~~~~~~~~~~~~~~~

    Core Signals.

    :copyright: (c) 2011-2013 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.dispatch import Signal


post_database_setup = Signal()
