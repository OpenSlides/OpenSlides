#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.motion.slides
    ~~~~~~~~~~~~~~~~~~~~~~~~

    Defines the slides for the User app.

    :copyright: (c) 2011–2013 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.template.loader import render_to_string

from openslides.projector.api import register_slide
from .models import User, Group


def user_slide(**kwargs):
    """
    Slide for the user model.
    """
    user_pk = kwargs.get('pk', None)
    try:
        user = User.objects.get(pk=user_pk)
    except User.DoesNotExist:
        return ''

    context = {'shown_user': user}
    return render_to_string('participant/user_slide.html', context)

register_slide(User.slide_callback_name, user_slide)


def group_slide(**kwargs):
    """
    Slide for the group model.
    """
    group_pk = kwargs.get('pk', None)
    try:
        group = Group.objects.get(pk=group_pk)
    except Group.DoesNotExist:
        return ''

    context = {'group': group}
    return render_to_string('participant/group_slide.html', context)

register_slide(Group.slide_callback_name, group_slide)
