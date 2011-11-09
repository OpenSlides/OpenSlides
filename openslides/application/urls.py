#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.application.urls
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~

    URL list for the application app.

    :copyright: 2011 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.conf.urls.defaults import *

urlpatterns = patterns('application.views',
    url(r'^application/$', 'overview', \
        name='application_overview'),

    url(r'^application/(?P<application_id>\d+)$', 'view', \
        name='application_view'),

    url(r'^application/(?P<application_id>\d+)/newest$', 'view', {'newest': True}, \
        name='application_view_newest'),

    url(r'^application/new$', 'edit', \
        name='application_new'),

    url(r'^application/import$', 'application_import', \
        name='application_import'),

    url(r'^application/(?P<application_id>\d+)/edit$', 'edit', \
        name='application_edit'),

    url(r'^application/(?P<application_id>\d+)/del$', 'delete', \
        name='application_delete'),

    url(r'^application/(?P<application_id>\d+)/setnumber$', 'set_number', \
        name='application_set_number'),

    url(r'^application/(?P<application_id>\d+)/setstatus/' \
        '(?P<status>[a-z]{3})$', 'set_status', \
        name='application_set_status'),

    url(r'^application/(?P<application_id>\d+)/permit$', 'permit', \
        name='application_permit'),

    url(r'^application/version/(?P<aversion_id>\d+)/permit$', 'permit_version', \
        name='application_version_permit'),

    url(r'^application/version/(?P<aversion_id>\d+)/reject$', 'reject_version', \
        name='application_version_reject'),

    url(r'^application/(?P<application_id>\d+)/notpermit$', 'notpermit', \
        name='application_notpermit'),

    url(r'^application/(?P<application_id>\d+)/reset$', 'reset', \
        name='application_reset'),

    url(r'^application/(?P<application_id>\d+)/support$', 'support', \
        name='application_support'),

    url(r'^application/(?P<application_id>\d+)/unsupport$', 'unsupport', \
        name='application_unsupport'),

    url(r'^application/(?P<application_id>\d+)/set_active/$', 'set_active',
        name='application_activate_item'),

    url(r'^application/(?P<application_id>\d+)/gen_poll$', 'gen_poll', \
        name='application_gen_poll'),

    url(r'^application/print$', 'print_application', \
        name='print_applications'),

    url(r'^application/(?P<application_id>\d+)/print$', 'print_application', \
        name='print_application'),

    url(r'^application/poll/(?P<poll_id>\d+)/print$', 'print_application_poll', \
        name='print_application_poll'),

    url(r'^application/poll/(?P<poll_id>\d+)$', 'view_poll', \
        name='application_poll_view'),

    url(r'^application/poll/(?P<poll_id>\d+)/del$', 'delete_poll', \
        name='application_poll_delete'),
)
