#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.assignments.urls
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~

    URL list for the assignment app.

    :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.conf.urls import url, patterns

from openslides.assignment.views import (AssignmentListView, AssignmentDetail,
    AssignmentCreateView, AssignmentUpdateView, AssignmentDeleteView,
    AssignmentSetStatusView, AssignmentRunView, AssignmentRunDeleteView,
    AssignmentRunOtherDeleteView, PollCreateView, PollUpdateView, AssignmentPDF,
    AssignmentPollPDF, AssignmentPollDeleteView, SetPublishStatusView,
    SetElectedView, CreateRelatedAgendaItemView)

urlpatterns = patterns('openslides.assignment.views',
    url(r'^$',
        AssignmentListView.as_view(),
        name='assignment_list',
    ),

    url(r'^(?P<pk>\d+)/$',
        AssignmentDetail.as_view(),
        name='assignment_detail'),

    url(r'^new/$',
        AssignmentCreateView.as_view(),
        name='assignment_create',
    ),

    url(r'^(?P<pk>\d+)/edit/$',
        AssignmentUpdateView.as_view(),
        name='assignment_update',
    ),

    url(r'^(?P<pk>\d+)/del/$',
        AssignmentDeleteView.as_view(),
        name='assignment_delete',
    ),

    url(r'^(?P<pk>\d+)/setstatus/(?P<status>[a-z]{3})/$',
        AssignmentSetStatusView.as_view(),
        name='assignment_set_status',
    ),

    url(r'^(?P<pk>\d+)/run/$',
        AssignmentRunView.as_view(),
        name='assignment_run',
    ),

    url(r'^(?P<pk>\d+)/delrun/$',
        AssignmentRunDeleteView.as_view(),
        name='assignment_delrun',
    ),

    url(r'^(?P<pk>\d+)/delother/(?P<user_id>[^/]+)/$',
        AssignmentRunOtherDeleteView.as_view(),
        name='assignment_delother',
    ),

    url(r'^poll/(?P<poll_id>\d+)/print/$',
        AssignmentPollPDF.as_view(),
        name='assignment_poll_pdf',
    ),

    url(r'^(?P<pk>\d+)/agenda/$',
        CreateRelatedAgendaItemView.as_view(),
        name='assignment_create_agenda',
    ),

    url(r'^print/$',
        AssignmentPDF.as_view(),
        name='assignment_list_pdf',
    ),

    url(r'^(?P<pk>\d+)/print/$',
        AssignmentPDF.as_view(),
        name='assignment_pdf',
    ),

    url(r'^(?P<pk>\d+)/gen_poll/$',
        PollCreateView.as_view(),
        name='assignment_poll_create',
    ),

    url(r'^poll/(?P<poll_id>\d+)/$',
        PollUpdateView.as_view(),
        name='assignment_poll_view',
    ),

    url(r'^poll/(?P<pk>\d+)/del/$',
        AssignmentPollDeleteView.as_view(),
        name='assignment_poll_delete',
    ),

    # TODO: use seperate urls to publish and unpublish the poll
    #       see assignment_user_elected
    url(r'^poll/(?P<pk>\d+)/pub/$',
        SetPublishStatusView.as_view(),
        name='assignment_poll_publish_status',
    ),

    url(r'^(?P<pk>\d+)/elected/(?P<user_id>[^/]+)/$',
        SetElectedView.as_view(),
        {'elected': True},
        name='assignment_user_elected',
    ),

    url(r'^(?P<pk>\d+)/notelected/(?P<user_id>[^/]+)/$',
        SetElectedView.as_view(),
        {'elected': False},
        name='assignment_user_not_elected',
    ),
)
