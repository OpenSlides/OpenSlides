#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.assignments.urls
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~

    URL list for the assignment app.

    :copyright: 2011 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.conf.urls.defaults import *

from assignment.views import ViewPoll #, ActivatePoll

urlpatterns = patterns('assignment.views',
    url(r'^$',
        'get_overview',
        name='assignment_overview',
    ),

    url(r'^(?P<assignment_id>\d+)$',
        'view',
        name='assignment_view'),

    url(r'^new$',
        'edit',
        name='assignment_new',
    ),

    url(r'^(?P<assignment_id>\d+)/edit$',
        'edit',
        name='assignment_edit',
    ),

    url(r'^(?P<assignment_id>\d+)/del$',
        'delete',
        name='assignment_delete',
    ),

    url(r'^(?P<assignment_id>\d+)/setstatus/(?P<status>[a-z]{3})$',
        'set_status',
        name='assignment_set_status',
    ),

    url(r'^(?P<assignment_id>\d+)/run$',
        'run',
        name='assignment_run',
    ),

    url(r'^(?P<assignment_id>\d+)/delrun$',
        'delrun',
        name='assignment_delrun',
    ),

    url(r'^(?P<assignment_id>\d+)/delother/(?P<profile_id>\d+)$',
        'delother',
        name='assignment_delother',
    ),

    url(r'^(?P<assignment_id>\d+)/set_active/$',
        'set_active',
        name='assignment_activate_item',
    ),

    url(r'^poll/(?P<poll_id>\d+)/print$',
        'print_assignment_poll',
        name='print_assignment_poll',
    ),

    url(r'^print$',
        'print_assignment',
        name='print_assignment',
    ),

    url(r'^(?P<assignment_id>\d+)/print$',
        'print_assignment',
        name='print_assignment',
    ),

    url(r'^(?P<assignment_id>\d+)/gen_poll$',
        'gen_poll',
        name='assignment_gen_poll',
    ),

    url(r'^poll/(?P<poll_id>\d+)$',
        ViewPoll.as_view(),
        name='assignment_poll_view',
    ),

    url(r'^poll/(?P<poll_id>\d+)/del$',
        'delete_poll',
        name='assignment_poll_delete',
    ),

    url(r'^poll/(?P<poll_id>\d+)/pub/$',
        'set_published',
        {'published': True},
        name='assignment_poll_publish',
    ),

    url(r'^poll/(?P<poll_id>\d+)/notpub/$',
        'set_published',
        {'published': False},
        name='assignment_poll_notpublish',
    ),

    url(r'^(?P<assignment_id>\d+)/elected/(?P<profile_id>\d+)$',
        'set_elected',
        {'elected': True},
        name='assignment_user_elected',
    ),

    url(r'^(?P<assignment_id>\d+)/notelected/(?P<profile_id>\d+)$',
        'set_elected',
        {'elected': False},
        name='assignment_user_not_elected',
    ),
)
