#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.assignment.slides
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Slides for the assignment app.

    :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from openslides.projector.api import register_slide_model

from .models import Assignment

register_slide_model(Assignment, 'assignment/slide.html')
