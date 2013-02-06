#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.motion.slides
    ~~~~~~~~~~~~~~~~~~~~~~~~

    Defines the Slides for the motion app.

    :copyright: (c) 2011-2013 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from openslides.projector.api import register_slidemodel
from .models import Motion

register_slidemodel(Motion)
