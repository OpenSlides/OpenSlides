#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.motion.slides
    ~~~~~~~~~~~~~~~~~~~~~~~~

    Defines the slides for the motion app.

    :copyright: (c) 2011–2013 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from openslides.projector.api import register_slide_model

from .models import Motion, MotionPoll

register_slide_model(Motion, 'motion/slide.html')
register_slide_model(MotionPoll, 'motion/motion_slide_poll.html')
