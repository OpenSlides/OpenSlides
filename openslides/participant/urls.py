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
    UserUpdateView, UserDeleteView, SetUserStatusView, UserImportView,
    ResetPasswordView, GroupOverviewView, GroupCreateView, GroupUpdateView,
    GroupDeleteView)

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

    url(r'^(?P<pk>\d+)/del/$',
        UserDeleteView.as_view(),
        name='user_delete',
    ),

    url(r'^(?P<pk>\d+)/reset_password/$',
        ResetPasswordView.as_view(),
        name='user_reset_password',
    ),

    url(r'^(?P<pk>\d+)/status/toggle/$',
        SetUserStatusView.as_view(),
        {'action': 'toggle'},
        name='user_status_toggle',
    ),

    url(r'^(?P<pk>\d+)/status/activate/$',
        SetUserStatusView.as_view(),
        {'action': 'activate'},
        name='user_status_activate',
    ),

    url(r'^(?P<pk>\d+)/status/deactivate/$',
        SetUserStatusView.as_view(),
        {'action': 'deactivate'},
        name='user_status_deactivate',
    ),

    url(r'^import/$',
        UserImportView.as_view(),
        name='user_import',
    ),

    url(r'^group/$',
        GroupOverviewView.as_view(),
        name='user_group_overview',
    ),

    url(r'^group/new/$',
        GroupCreateView.as_view(),
        name='user_group_new',
    ),

    url(r'^group/(?P<pk>\d+)/edit/$',
        GroupUpdateView.as_view(),
        name='user_group_edit',
    ),

    url(r'^group/(?P<pk>\d+)/del/$',
        GroupDeleteView.as_view(),
        name='user_group_delete',
    ),

    url(r'^print/$',
        ParticipantsListPDF.as_view(),
        name='user_print',
    ),

    url(r'^passwords/print/$',
        ParticipantsPasswordsPDF.as_view(),
        name='print_passwords',
    ),
)
