#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.assignments.urls
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~

    URL list for the assignment app.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.conf.urls import url, patterns

from openslides.assignment.views import (ViewPoll, AssignmentPDF,
    AssignmentPollPDF, AssignmentPollDelete, CreateAgendaItem)

urlpatterns = patterns('openslides.assignment.views',
    url(r'^$',
        'get_overview',
        name='assignment_overview',
    ),

    url(r'^(?P<assignment_id>\d+)/$',
        'view',
        name='assignment_view'),

    url(r'^new/$',
        'edit',
        name='assignment_new',
    ),

    url(r'^(?P<assignment_id>\d+)/edit/$',
        'edit',
        name='assignment_edit',
    ),

    url(r'^(?P<assignment_id>\d+)/del/$',
        'delete',
        name='assignment_delete',
    ),

    url(r'^(?P<assignment_id>\d+)/setstatus/(?P<status>[a-z]{3})/$',
        'set_status',
        name='assignment_set_status',
    ),

    url(r'^(?P<assignment_id>\d+)/run/$',
        'run',
        name='assignment_run',
    ),

    url(r'^(?P<assignment_id>\d+)/delrun/$',
        'delrun',
        name='assignment_delrun',
    ),

    url(r'^(?P<assignment_id>\d+)/delother/(?P<user_id>[^/]+)/$',
        'delother',
        name='assignment_delother',
    ),

    url(r'^(?P<assignment_id>\d+)/set_active/$',
        'set_active',
        name='assignment_activate_item',
    ),

    url(r'^poll/(?P<poll_id>\d+)/print/$',
        AssignmentPollPDF.as_view(),
        name='print_assignment_poll',
    ),

    url(r'^(?P<assignment_id>\d+)/agenda/$',
        CreateAgendaItem.as_view(),
        name='assignment_create_agenda',
    ),

    url(r'^print/$',
        AssignmentPDF.as_view(),
        name='print_assignment',
    ),

    url(r'^(?P<assignment_id>\d+)/print/$',
        AssignmentPDF.as_view(),
        name='print_assignment',
    ),

    url(r'^(?P<assignment_id>\d+)/gen_poll/$',
        'gen_poll',
        name='assignment_gen_poll',
    ),

    url(r'^poll/(?P<poll_id>\d+)/$',
        ViewPoll.as_view(),
        name='assignment_poll_view',
    ),

    url(r'^poll/(?P<pk>\d+)/del/$',
        AssignmentPollDelete.as_view(),
        name='assignment_poll_delete',
    ),

    url(r'^poll/(?P<poll_id>\d+)/pub/$',
        'set_publish_status',
        name='assignment_poll_publish_status',
    ),

    url(r'^(?P<assignment_id>\d+)/elected/(?P<user_id>[^/]+)/$',
        'set_elected',
        {'elected': True},
        name='assignment_user_elected',
    ),

    url(r'^(?P<assignment_id>\d+)/notelected/(?P<user_id>[^/]+)/$',
        'set_elected',
        {'elected': False},
        name='assignment_user_not_elected',
    ),
)
