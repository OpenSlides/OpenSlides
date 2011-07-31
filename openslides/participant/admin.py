#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.participant.admin
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Register app for admin site.

    :copyright: 2011 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.contrib import admin
from participant.models import Profile

admin.site.register(Profile)
