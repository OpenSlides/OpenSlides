#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.projector.urls
    ~~~~~~~~~~~~~~~~~~~~~~

    URL list for the projector app.

    :copyright: 2011 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.conf.urls.defaults import *

urlpatterns = patterns('projector.views',
    url(r'^$', 'active_slide',
        name='projector_show'),

    url(r'^bigger$', 'projector_edit', {'direction': 'bigger'},
        name='projector_bigger'),

    url(r'^smaller$', 'projector_edit', {'direction': 'smaller'},
        name='projector_smaller'),

    url(r'^up$', 'projector_edit', {'direction': 'up'},
        name='projector_up'),

    url(r'^projector/down$', 'projector_edit', {'direction': 'down'},
        name='projector_down'),

    url(r'^projector/clean$', 'projector_edit', {'direction': 'clean'},
        name='projector_clean'),

    url(r'^projector/countdown/show$', 'projector_countdown', {'command': 'show'},
        name='countdown_open'),

    url(r'^projector/countdown/hide$', 'projector_countdown', {'command': 'hide'},
        name='countdown_close'),

    url(r'^projector/countdown/reset/(?P<time>\d+)$', 'projector_countdown', {'command': 'reset'},
        name='countdown_reset'),

    url(r'^projector/countdown/start$', 'projector_countdown', {'command': 'start'},
        name='countdown_start'),

    url(r'^projector/countdown/stop$', 'projector_countdown', {'command': 'stop'},
        name='countdown_stop'),
)
