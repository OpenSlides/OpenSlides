#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.participant.urls
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~

    URL list for the participant app.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.conf.urls.defaults import url, patterns
from django.core.urlresolvers import reverse

from openslides.participant.views import (
    ParticipantsListPDF, ParticipantsPasswordsPDF, Overview, UserCreateView,
    UserUpdateView, UserDeleteView)

urlpatterns = patterns('openslides.participant.views',
    url(r'^$',
        Overview.as_view(),
        name='user_overview',
    ),

    url(r'^new/$',
        UserCreateView.as_view(),
        name='user_new',
    ),

    url(r'^(?P<pk>\d+)/edit/$',
        UserUpdateView.as_view(),
        name='user_edit',
    ),

    url(r'^print/$',
        ParticipantsListPDF.as_view(),
        name='user_print',
    ),

    url(r'^(?P<pk>\d+)/del/$',
        UserDeleteView.as_view(),
        name='user_delete',
    ),

    url(r'^(?P<user_id>\d+)/status/$',
        'user_set_status',
        name='user_status',
    ),

    url(r'^import/$',
        'user_import',
        name='user_import',
    ),

    url(r'^group/$',
        'get_group_overview',
        name='user_group_overview',
    ),

    url(r'^group/new/$',
        'group_edit',
        name='user_group_new',
    ),

    url(r'^group/(?P<group_id>\d+)/edit/$',
        'group_edit',
        name='user_group_edit',
    ),

    url(r'^group/(?P<group_id>\d+)/del/$',
        'group_delete',
        name='user_group_delete',
    ),

    url(r'^resetpassword/(?P<user_id>\d+)/$',
        'reset_password',
        name='user_reset_password',
    ),

    url(r'^passwords/print/$',
        ParticipantsPasswordsPDF.as_view(),
        name='print_passwords',
    ),
)
