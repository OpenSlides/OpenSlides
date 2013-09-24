#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.motion.slides
    ~~~~~~~~~~~~~~~~~~~~~~~~

    Defines the slides for the motion app.

    :copyright: (c) 2011–2013 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.template.loader import render_to_string

from openslides.projector.api import register_slide
from .models import Motion


def motion_slide(**kwargs):
    """
    Slide for the motion app.
    """
    motion_pk = kwargs.get('pk', None)
    try:
        motion = Motion.objects.get(pk=motion_pk)
    except Motion.DoesNotExist:
        return ''

    context = {
        'motion': motion,
        'title': motion.title}

    return render_to_string('motion/slide.html', context)

register_slide(Motion.slide_callback_name, motion_slide)
