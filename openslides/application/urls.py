#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.application.urls
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~

    URL list for the application app.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.conf.urls.defaults import url, patterns

from application.views import (ApplicationDelete, ViewPoll, ApplicationPDF,
    ApplicationPollPDF, CreateAgendaItem)

urlpatterns = patterns('application.views',
    url(r'^$',
        'overview',
        name='application_overview',
    ),

    url(r'^(?P<application_id>\d+)/$',
        'view',
        name='application_view',
    ),

    url(r'^(?P<application_id>\d+)/agenda/$',
        CreateAgendaItem.as_view(),
        name='application_create_agenda',
    ),

    url(r'^(?P<application_id>\d+)/newest/$',
        'view',
        {'newest': True},
        name='application_view_newest',
    ),

    url(r'^new/$',
        'edit',
        name='application_new',
    ),

    url(r'^import/$',
        'application_import',
        name='application_import',
    ),

    url(r'^(?P<application_id>\d+)/edit/$',
        'edit',
        name='application_edit',
    ),

    url(r'^(?P<application_id>\d+)/del/$',
        ApplicationDelete.as_view(),
        name='application_delete',
    ),

    url(r'^del/$',
        ApplicationDelete.as_view(),
        { 'application_id' : None , 'application_ids' : None },
        name='application_delete',
    ),

    url(r'^(?P<application_id>\d+)/setnumber/$',
        'set_number',
        name='application_set_number',
    ),

    url(r'^(?P<application_id>\d+)/setstatus/(?P<status>[a-z]{3})/$',
        'set_status',
        name='application_set_status',
    ),

    url(r'^(?P<application_id>\d+)/permit/$',
        'permit',
        name='application_permit',
    ),

    url(r'^version/(?P<aversion_id>\d+)/permit/$',
        'permit_version',
        name='application_version_permit',
    ),

    url(r'^version/(?P<aversion_id>\d+)/reject/$',
        'reject_version',
        name='application_version_reject',
    ),

    url(r'^(?P<application_id>\d+)/notpermit/$',
        'notpermit',
        name='application_notpermit',
    ),

    url(r'^(?P<application_id>\d+)/reset/$',
        'reset',
        name='application_reset',
    ),

    url(r'^(?P<application_id>\d+)/support/$',
        'support',
        name='application_support',
    ),

    url(r'^(?P<application_id>\d+)/unsupport/$',
        'unsupport',
        name='application_unsupport',
    ),

    url(r'^(?P<application_id>\d+)/gen_poll/$',
        'gen_poll',
        name='application_gen_poll',
    ),

    url(r'^print/$',
        ApplicationPDF.as_view(),
        {'application_id': None},
        name='print_applications',
    ),

    url(r'^(?P<application_id>\d+)/print/$',
        ApplicationPDF.as_view(),
        name='print_application',
    ),

    url(r'^poll/(?P<poll_id>\d+)/print/$',
        ApplicationPollPDF.as_view(),
        name='print_application_poll',
    ),

    url(r'^poll/(?P<poll_id>\d+)/$',
        ViewPoll.as_view(),
        name='application_poll_view',
    ),

    url(r'^poll/(?P<poll_id>\d+)/del/$',
        'delete_poll',
        name='application_poll_delete',
    ),
)
