#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.application.admin
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Register app for admin site.

    :copyright: 2011 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.contrib import admin
from openslides.application.models import Application, AVersion

admin.site.register(Application)
admin.site.register(AVersion)
