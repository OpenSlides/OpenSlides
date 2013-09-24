#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.assignment.slides
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Slides for the assignment app.

    :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.template.loader import render_to_string

from openslides.config.api import config
from openslides.projector.api import register_slide
from .models import Assignment


def assignment_slide(**kwargs):
    """
    Slide for an Assignment
    """
    assignment_pk = kwargs.get('pk', None)
    try:
        assignment = Assignment.objects.get(pk=assignment_pk)
    except Assignment.DoesNotExist:
        return ''

    polls = assignment.poll_set
    context = {
        'polls': polls.filter(published=True),
        'vote_results': assignment.vote_results(only_published=True),
        'assignment': assignment}

    return render_to_string('assignment/slide.html', context)

register_slide(Assignment.slide_callback_name, assignment_slide)
