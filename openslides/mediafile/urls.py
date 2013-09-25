#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.mediafile.urls
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~

    URL patterns for the mediafile app.

    :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.conf.urls import patterns, url

from . import views

urlpatterns = patterns(
    '',
    url(r'^$',
        views.MediafileListView.as_view(),
        name='mediafile_list'),

    url(r'^new/$',
        views.MediafileCreateView.as_view(),
        name='mediafile_create'),

    url(r'^(?P<pk>\d+)/edit/$',
        views.MediafileUpdateView.as_view(),
        name='mediafile_update'),

    url(r'^(?P<pk>\d+)/del/$',
        views.MediafileDeleteView.as_view(),
        name='mediafile_delete'),
)
