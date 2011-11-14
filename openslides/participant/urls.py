#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.participant.urls
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~

    URL list for the participant app.

    :copyright: 2011 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.conf.urls.defaults import *
from django.core.urlresolvers import reverse

urlpatterns = patterns('participant.views',
    url(r'^participant/$', 'get_overview', name='user_overview'),
    url(r'^participant/new$', 'edit', name='user_new'),
    url(r'^participant/(?P<user_id>\d+)/edit$', 'edit', name='user_edit'),
    url(r'^participant/print$', 'print_userlist', name='user_print'),
    url(r'^participant/(?P<user_id>\d+)/del$', 'user_delete', name='user_delete'),
    url(r'^participant/(?P<user_id>\d+)/admin$', 'user_set_superuser', name='user_set_superuser'),
    url(r'^participant/(?P<user_id>\d+)/active$', 'user_set_active', name='user_set_active'),
    url(r'^participant/import$', 'user_import', name='user_import'),
    url(r'^participant/group/$', 'get_group_overview', name='user_group_overview'),
    url(r'^participant/group/new$', 'group_edit', name='user_group_new'),
    url(r'^participant/group/(?P<group_id>\d+)/edit$', 'group_edit', name='user_group_edit'),
    url(r'^participant/group/(?P<group_id>\d+)/del$', 'group_delete', name='user_group_delete'),
    url(r'^user/settings$', 'user_settings', name='user_settings'),
    url(r'^participant/resetpassword/(?P<user_id>\d+)$', 'reset_password', name='user_reset_password'),
    url(r'^participant/passwords/print$', 'print_passwords', name='print_passwords'),
)

urlpatterns += patterns('django.contrib.auth.views',
    url(
        r'^login/$',
        'login',
        {'template_name': 'participant/login.html'},
        name='user_login',
    ),
    url(
        r'^logout/$',
        'logout_then_login',
        name='user_logout',
    )
)
