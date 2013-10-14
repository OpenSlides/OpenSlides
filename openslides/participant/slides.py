#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.motion.slides
    ~~~~~~~~~~~~~~~~~~~~~~~~

    Defines the slides for the User app.

    :copyright: (c) 2011–2013 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from openslides.projector.api import register_slide_model

from .models import Group, User

register_slide_model(User, 'participant/user_slide.html')
register_slide_model(Group, 'participant/group_slide.html')
