#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.core.urls
    ~~~~~~~~~~~~~~~~~~~~

    Url patterns for the core app.

    :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.conf.urls import patterns, url

from openslides.utils.views import RedirectView
from .views import VersionView


urlpatterns = patterns('',

    # Redirect to dashboard URL
    url(r'^$',
        RedirectView.as_view(url='projector/dashboard/'),
        name='home',),

    url(r'^version/$',
        VersionView.as_view(),
        name='core_version',),
)
