#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.motion.urls
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~

    URL list for the motion app.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.conf.urls.defaults import url, patterns

from openslides.motion.views import (MotionDelete, ViewPoll,
    MotionPDF, MotionPollPDF, CreateAgendaItem, SupportView)

urlpatterns = patterns('openslides.motion.views',
    url(r'^$',
        'overview',
        name='motion_overview',
    ),

    url(r'^(?P<motion_id>\d+)/$',
        'view',
        name='motion_view',
    ),

    url(r'^(?P<motion_id>\d+)/agenda/$',
        CreateAgendaItem.as_view(),
        name='motion_create_agenda',
    ),

    url(r'^(?P<motion_id>\d+)/newest/$',
        'view',
        {'newest': True},
        name='motion_view_newest',
    ),

    url(r'^new/$',
        'edit',
        name='motion_new',
    ),

    url(r'^import/$',
        'motion_import',
        name='motion_import',
    ),

    url(r'^(?P<motion_id>\d+)/edit/$',
        'edit',
        name='motion_edit',
    ),

    url(r'^(?P<motion_id>\d+)/del/$',
        MotionDelete.as_view(),
        name='motion_delete',
    ),

    url(r'^del/$',
        MotionDelete.as_view(),
        { 'motion_id' : None , 'motion_ids' : None },
        name='motion_delete',
    ),

    url(r'^(?P<motion_id>\d+)/setnumber/$',
        'set_number',
        name='motion_set_number',
    ),

    url(r'^(?P<motion_id>\d+)/setstatus/(?P<status>[a-z]{3})/$',
        'set_status',
        name='motion_set_status',
    ),

    url(r'^(?P<motion_id>\d+)/permit/$',
        'permit',
        name='motion_permit',
    ),

    url(r'^version/(?P<aversion_id>\d+)/permit/$',
        'permit_version',
        name='motion_version_permit',
    ),

    url(r'^version/(?P<aversion_id>\d+)/reject/$',
        'reject_version',
        name='motion_version_reject',
    ),

    url(r'^(?P<motion_id>\d+)/notpermit/$',
        'notpermit',
        name='motion_notpermit',
    ),

    url(r'^(?P<motion_id>\d+)/reset/$',
        'reset',
        name='motion_reset',
    ),

    url(r'^(?P<motion_id>\d+)/support/$',
        SupportView.as_view(support=True),
        name='motion_support',
    ),

    url(r'^(?P<motion_id>\d+)/unsupport/$',
        SupportView.as_view(support=False),
        name='motion_unsupport',
    ),

    url(r'^(?P<motion_id>\d+)/gen_poll/$',
        'gen_poll',
        name='motion_gen_poll',
    ),

    url(r'^print/$',
        MotionPDF.as_view(),
        {'motion_id': None},
        name='print_motions',
    ),

    url(r'^(?P<motion_id>\d+)/print/$',
        MotionPDF.as_view(),
        name='print_motion',
    ),

    url(r'^poll/(?P<poll_id>\d+)/print/$',
        MotionPollPDF.as_view(),
        name='print_motion_poll',
    ),

    url(r'^poll/(?P<poll_id>\d+)/$',
        ViewPoll.as_view(),
        name='motion_poll_view',
    ),

    url(r'^poll/(?P<poll_id>\d+)/del/$',
        'delete_poll',
        name='motion_poll_delete',
    ),
)
