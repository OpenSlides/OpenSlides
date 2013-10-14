#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.projector.slides
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Slides for the projector app.

    :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from openslides.projector.api import register_slide_model

from .models import ProjectorSlide

register_slide_model(ProjectorSlide, 'projector/slide_projectorslide.html')
