#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.mediafile.urls
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~

    URL patterns for the mediafile app.

    :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.conf.urls import url, patterns

from .models import Mediafile
from .views import (MediafileListView, MediafileCreateView,
                    MediafileUpdateView, MediafileDeleteView)


urlpatterns = patterns('',
    url(r'^$',
        MediafileListView.as_view(),
        name='mediafile_list',
    ),

    url(r'^new/$',
        MediafileCreateView.as_view(),
        name='mediafile_create',
    ),

    url(r'^(?P<pk>\d+)/edit/$',
        MediafileUpdateView.as_view(),
        name='mediafile_update',
    ),

    url(r'^(?P<pk>\d+)/del/$',
        MediafileDeleteView.as_view(),
        name='mediafile_delete',
    ),
)
