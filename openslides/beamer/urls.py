#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.beamer.urls
    ~~~~~~~~~~~~~~~~~~~~~~

    URL list for the beamer app.

    :copyright: 2011 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.conf.urls.defaults import *

urlpatterns = patterns('beamer.views',
    url(r'^$', 'beamer',
        name='beamer_show'),

    url(r'^bigger$', 'beamer_edit', {'direction': 'bigger'},
        name='beamer_bigger'),

    url(r'^smaller$', 'beamer_edit', {'direction': 'smaller'}, name='beamer_smaller'),

    url(r'^up$', 'beamer_edit', {'direction': 'up'},
        name='beamer_up'),

    url(r'^beamer/down$', 'beamer_edit', {'direction': 'down'},
        name='beamer_down'),

    url(r'^beamer/clean$', 'beamer_edit', {'direction': 'clean'},
        name='beamer_clean'),

    url(r'^beamer/countdown/show$', 'beamer_countdown', {'command': 'show'},
        name='countdown_open'),

    url(r'^beamer/countdown/hide$', 'beamer_countdown', {'command': 'hide'},
        name='countdown_close'),

    url(r'^beamer/countdown/reset/(?P<time>\d+)$', 'beamer_countdown', {'command': 'reset'},
        name='countdown_reset'),

    url(r'^beamer/countdown/start$', 'beamer_countdown', {'command': 'start'},
        name='countdown_start'),

    url(r'^beamer/countdown/stop$', 'beamer_countdown', {'command': 'stop'},
        name='countdown_stop'),
)
