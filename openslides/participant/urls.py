#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.participant.urls
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~

    URL list for the participant app.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.conf.urls import url, patterns

from openslides.participant.views import (
    UserOverview, UserCreateView, UserDetailView, UserUpdateView,
    UserDeleteView, ResetPasswordView, SetUserStatusView, UserImportView,
    GroupOverview, GroupCreateView, GroupDetailView, GroupUpdateView, GroupDeleteView,
    ParticipantsListPDF, ParticipantsPasswordsPDF)

urlpatterns = patterns('',

    # User
    url(r'^$',
        UserOverview.as_view(),
        name='user_overview',
    ),

    url(r'^new/$',
        UserCreateView.as_view(),
        name='user_new',
    ),

    url(r'^(?P<pk>\d+)/$',
        UserDetailView.as_view(),
        name='user_view',
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

    url(r'^(?P<pk>\d+)/status/toggle/$',
        SetUserStatusView.as_view(),
        {'action': 'toggle'},
        name='user_status_toggle',
    ),

    url(r'^import/$',
        UserImportView.as_view(),
        name='user_import',
    ),

    # Group
    url(r'^group/$',
        GroupOverview.as_view(),
        name='user_group_overview',
    ),

    url(r'^group/new/$',
        GroupCreateView.as_view(),
        name='user_group_new',
    ),

    url(r'^group/(?P<pk>\d+)/$',
        GroupDetailView.as_view(),
        name='user_group_view',
    ),

    url(r'^group/(?P<pk>\d+)/edit/$',
        GroupUpdateView.as_view(),
        name='user_group_edit',
    ),

    url(r'^group/(?P<pk>\d+)/del/$',
        GroupDeleteView.as_view(),
        name='user_group_delete',
    ),

    # PDF
    url(r'^print/$',
        ParticipantsListPDF.as_view(),
        name='user_print',
    ),

    url(r'^passwords/print/$',
        ParticipantsPasswordsPDF.as_view(),
        name='print_passwords',
    ),
)
