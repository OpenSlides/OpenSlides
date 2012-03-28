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
    url(r'^beamer/$', 'beamer',
        name='item_beamer'),

    url(r'^$', 'overview'),

    url(r'^agenda/$', 'overview',
        name='item_overview'),

    url(r'^agenda/(?P<item_id>\d+)/$', 'view',
        name='item_view'),

    url(r'^agenda/(?P<item_id>\d+)/activate/$', 'set_active',
        name='item_activate'),

    url(r'^agenda/(?P<item_id>\d+)/activate/summary/$', 'set_active',
        {'summary': True},\
        name='item_activate_summary'),

    url(r'^agenda/(?P<item_id>\d+)/close/$', 'set_closed', {'closed': True},
        name='item_close'),

    url(r'^agenda/(?P<item_id>\d+)/open/$', 'set_closed', {'closed': False},
        name='item_open'),

    url(r'^agenda/(?P<item_id>\d+)/edit/$', 'edit',
        name='item_edit'),

    url(r'^agenda/new/$', 'edit',
        name='item_new_default'),

    url(r'^agenda/new/(?P<form>ItemText|ItemApplication|ItemPoll|'
                           r'ItemAssignment)/$', 'edit',
        name='item_new'),

    url(r'^agenda/new/(?P<form>ItemText|ItemApplication|ItemPoll|'
                           r'ItemAssignment)/(?P<default>\d+)/$', 'edit',
        name='item_new_default'),

    url(r'^agenda/(?P<item_id>\d+)/del/$', 'delete',
        name='item_delete'),

    url(r'^agenda/print/$', 'print_agenda',
        name='print_agenda'),

    url(r'^beamer/bigger$', 'beamer_edit', {'direction': 'bigger'}, name='beamer_bigger'),

    url(r'^beamer/smaller$', 'beamer_edit', {'direction': 'smaller'}, name='beamer_smaller'),

    url(r'^beamer/up$', 'beamer_edit', {'direction': 'up'}, name='beamer_up'),

    url(r'^beamer/down$', 'beamer_edit', {'direction': 'down'}, name='beamer_down'),

    url(r'^beamer/clean$', 'beamer_edit', {'direction': 'clean'}, name='beamer_clean'),

    url(r'^beamer/countdown/show$', 'beamer_countdown', {'command': 'show'}, name='countdown_open'),

    url(r'^beamer/countdown/hide$', 'beamer_countdown', {'command': 'hide'}, name='countdown_close'),

    url(r'^beamer/countdown/reset/(?P<time>\d+)$', 'beamer_countdown', {'command': 'reset'}, name='countdown_reset'),

    url(r'^beamer/countdown/start$', 'beamer_countdown', {'command': 'start'}, name='countdown_start'),

    url(r'^beamer/countdown/stop$', 'beamer_countdown', {'command': 'stop'}, name='countdown_stop'),
)
