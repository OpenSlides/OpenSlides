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
    url(r'^$',
        'get_overview',
        name='user_overview',
    ),

    url(r'^new$',
        'edit',
        name='user_new',
    ),

    url(r'^(?P<user_id>\d+)/edit$',
        'edit',
        name='user_edit',
    ),

    url(r'^print$',
        'print_userlist',
        name='user_print',
    ),

    url(r'^(?P<user_id>\d+)/del$',
        'user_delete',
        name='user_delete',
    ),

    url(r'^(?P<user_id>\d+)/active/$',
        'user_set_active',
        {'active': True},
        name='user_active',
    ),

    url(r'^(?P<user_id>\d+)/inactive/$',
        'user_set_active',
        {'active': False},
        name='user_inactive',
    ),

    url(r'^(?P<user_id>\d+)/superuser/$',
        'user_set_superuser',
        {'superuser': True},
        name='user_superuser',
    ),

    url(r'^(?P<user_id>\d+)/normaluser/$',
        'user_set_superuser',
        {'superuser': False},
        name='user_normaluser',
    ),

    url(r'^import$',
        'user_import',
        name='user_import',
    ),

    url(r'^group/$',
        'get_group_overview',
        name='user_group_overview',
    ),

    url(r'^group/new$',
        'group_edit',
        name='user_group_new',
    ),

    url(r'^group/(?P<group_id>\d+)/edit$',
        'group_edit',
        name='user_group_edit',
    ),

    url(r'^group/(?P<group_id>\d+)/del$',
        'group_delete',
        name='user_group_delete',
    ),

    url(r'^user/settings$',
        'user_settings',
        name='user_settings',
    ),

    url(r'^resetpassword/(?P<user_id>\d+)$',
        'reset_password',
        name='user_reset_password',
    ),

    url(r'^passwords/print$',
        'print_passwords',
        name='print_passwords',
    ),
)
