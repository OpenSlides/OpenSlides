#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.projector.slides
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Slides for the projector app.

    :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.template.loader import render_to_string

from openslides.config.api import config
from openslides.projector.api import register_slide

from .models import ProjectorSlide


def projector_slide(**kwargs):
    """
    Return the html code for a custom slide.
    """
    slide_pk = kwargs.get('pk', None)

    try:
        slide = ProjectorSlide.objects.get(pk=slide_pk)
    except ProjectorSlide.DoesNotExist:
        slide = None

    context = {'slide': slide}
    return render_to_string('projector/slide_projectorslide.html', context)


register_slide('projector_slide', projector_slide)
