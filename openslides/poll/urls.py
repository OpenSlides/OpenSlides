#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.poll.urls
    ~~~~~~~~~~~~~~~~~~~~

    URL list for the poll app.

    :copyright: 2011 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.conf.urls.defaults import *

urlpatterns = patterns('poll.views',
    url(r'^poll/$', 'get_overview', name='poll_overview'),
    url(r'^poll/(?P<poll_id>\d+)$', 'view', name='poll_view'),
    url(r'^poll/new$', 'edit', name='poll_new'),
    url(r'^poll/(?P<poll_id>\d+)/edit$', 'edit', name='poll_edit'),
    url(r'^poll/(?P<poll_id>\d+)/del$', 'delete', name='poll_delete'),
    url(r'^poll/option/new$', 'option_edit', name='option_new'),
    url(r'^poll/(?P<poll_id>\d+)/option/new$', 'option_edit', name='option_new_fixpoll'),
    url(r'^poll/option/(?P<option_id>\d+)/edit$', 'option_edit', name='option_edit'),
    url(r'^poll/option/(?P<option_id>\d+)/del$', 'option_delete', name='option_delete'),
 #   url(r'^poll/pdf/(?P<poll_id>\d+)$', 'print_poll', name='poll_print'),
)
