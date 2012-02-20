#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.agenda.urls
    ~~~~~~~~~~~~~~~~~~~~~~

    URL list for the agenda app.

    :copyright: 2011 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.conf.urls.defaults import *
from agenda.views import Overview, View, SetActive, SetClosed, ItemUpdate, ItemCreate, ItemDelete

urlpatterns = patterns('agenda.views',
    url(r'^$',
        Overview.as_view(),
        name='item_overview',
    ),

    url(r'^(?P<item_id>\d+)/$',
        View.as_view(),
        name='item_view',
    ),

    url(r'^(?P<item_id>\d+)/activate/$',
        SetActive.as_view(),
        {'summary': False},
        name='item_activate',
    ),

    url(r'^(?P<item_id>\d+)/activate/summary/$',
        SetActive.as_view(),
        {'summary': True},
        name='item_activate_summary',
    ),

    url(r'^(?P<item_id>\d+)/close/$',
        SetClosed.as_view(),
        {'closed': True},
        name='item_close',
    ),

    url(r'^(?P<item_id>\d+)/open/$',
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
        'print_agenda',
        name='print_agenda',
    ),
)
