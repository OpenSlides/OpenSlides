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

urlpatterns = patterns('agenda.views',
    url(r'^/$', 'overview',
        name='item_overview'),

    url(r'^(?P<item_id>\d+)/$', 'view',
        name='item_view'),

    url(r'^(?P<item_id>\d+)/activate/$', 'set_active',
        name='item_activate'),

    url(r'^(?P<item_id>\d+)/activate/summary/$', 'set_active',
        {'summary': True},\
        name='item_activate_summary'),

    url(r'^(?P<item_id>\d+)/close/$', 'set_closed', {'closed': True},
        name='item_close'),

    url(r'^(?P<item_id>\d+)/open/$', 'set_closed', {'closed': False},
        name='item_open'),

    url(r'^(?P<item_id>\d+)/edit/$', 'edit',
        name='item_edit'),

    url(r'^new/$', 'edit',
        name='item_new'),

    url(r'^(?P<item_id>\d+)/del/$', 'delete',
        name='item_delete'),

    url(r'^print/$', 'print_agenda',
        name='print_agenda'),
)
