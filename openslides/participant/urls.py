#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.participant.urls
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~

    URL list for the participant app.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.conf.urls.defaults import *
from django.core.urlresolvers import reverse

from participant.views import ParticipantsListPDF, ParticipantsPasswordsPDF

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
        ParticipantsListPDF.as_view(),
        name='user_print',
    ),

    url(r'^(?P<user_id>\d+)/del$',
        'user_delete',
        name='user_delete',
    ),

    url(r'^(?P<user_id>\d+)/status/$',
        'user_set_status',
        name='user_status',
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
        ParticipantsPasswordsPDF.as_view(),
        name='print_passwords',
    ),
)
