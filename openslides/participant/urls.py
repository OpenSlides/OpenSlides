# -*- coding: utf-8 -*-

from django.conf.urls import patterns, url

from . import views

urlpatterns = patterns(
    '',
    # User
    url(r'^$',
        views.UserOverview.as_view(),
        name='user_overview'),

    url(r'^new/$',
        views.UserCreateView.as_view(),
        name='user_new'),

    url(r'^(?P<pk>\d+)/$',
        views.UserDetailView.as_view(),
        name='user_view'),

    url(r'^(?P<pk>\d+)/edit/$',
        views.UserUpdateView.as_view(),
        name='user_edit'),

    url(r'^(?P<pk>\d+)/del/$',
        views.UserDeleteView.as_view(),
        name='user_delete'),

    url(r'^(?P<pk>\d+)/reset_password/$',
        views.ResetPasswordView.as_view(),
        name='user_reset_password'),

    url(r'^(?P<pk>\d+)/status/activate/$',
        views.SetUserStatusView.as_view(),
        {'action': 'activate'},
        name='user_status_activate'),

    url(r'^(?P<pk>\d+)/status/deactivate/$',
        views.SetUserStatusView.as_view(),
        {'action': 'deactivate'},
        name='user_status_deactivate'),

    url(r'^(?P<pk>\d+)/status/toggle/$',
        views.SetUserStatusView.as_view(),
        {'action': 'toggle'},
        name='user_status_toggle'),

    url(r'^import/$',
        views.UserImportView.as_view(),
        name='user_import'),

    # Group
    url(r'^group/$',
        views.GroupOverview.as_view(),
        name='user_group_overview'),

    url(r'^group/new/$',
        views.GroupCreateView.as_view(),
        name='user_group_new'),

    url(r'^group/(?P<pk>\d+)/$',
        views.GroupDetailView.as_view(),
        name='user_group_view'),

    url(r'^group/(?P<pk>\d+)/edit/$',
        views.GroupUpdateView.as_view(),
        name='user_group_edit'),

    url(r'^group/(?P<pk>\d+)/del/$',
        views.GroupDeleteView.as_view(),
        name='user_group_delete'),

    # PDF
    url(r'^print/$',
        views.ParticipantsListPDF.as_view(),
        name='user_print'),

    url(r'^passwords/print/$',
        views.ParticipantsPasswordsPDF.as_view(),
        name='print_passwords'),
)
