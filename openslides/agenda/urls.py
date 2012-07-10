#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.agenda.urls
    ~~~~~~~~~~~~~~~~~~~~~~

    URL list for the agenda app.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.conf.urls.defaults import url, patterns
from openslides.agenda.views import (Overview, View, SetClosed, ItemUpdate,
    ItemCreate, ItemDelete, AgendaPDF)

urlpatterns = patterns('',
    url(r'^$',
        Overview.as_view(),
        name='item_overview',
    ),

    url(r'^(?P<pk>\d+)/$',
        View.as_view(),
        name='item_view',
    ),

    url(r'^(?P<pk>\d+)/close/$',
        SetClosed.as_view(),
        {'closed': True},
        name='item_close',
    ),

    url(r'^(?P<pk>\d+)/open/$',
        SetClosed.as_view(),
        {'closed': False},
        name='item_open',
    ),

    url(r'^(?P<pk>\d+)/edit/$',
        ItemUpdate.as_view(),
        name='item_edit',
    ),

    url(r'^new/$',
        ItemCreate.as_view(),
        name='item_new',
    ),

    url(r'^(?P<pk>\d+)/del/$',
        ItemDelete.as_view(),
        name='item_delete',
    ),

    url(r'^print/$',
        AgendaPDF.as_view(),
        name='print_agenda',
    ),
)
