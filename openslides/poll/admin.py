#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.poll.admin
    ~~~~~~~~~~~~~~~~~~~~~

    Register app for admin site.

    :copyright: 2011 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.contrib import admin
from poll.models import Poll, Option

admin.site.register(Poll)
admin.site.register(Option)
