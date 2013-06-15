#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.motion.urls
    ~~~~~~~~~~~~~~~~~~~~~~

    Defines the URL patterns for the motion app.

    :copyright: (c) 2011–2013 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.conf.urls import url, patterns


urlpatterns = patterns('openslides.motion.views',
    url(r'^$',
        'motion_list',
        name='motion_list',
    ),

    url(r'^new/$',
        'motion_create',
        # TODO: rename to motion_create
        name='motion_new',
    ),

    url(r'^(?P<pk>\d+)/$',
        'motion_detail',
        name='motion_detail',
    ),

    url(r'^(?P<pk>\d+)/edit/$',
        'motion_edit',
        name='motion_edit',
    ),

    url(r'^(?P<pk>\d+)/del/$',
        'motion_delete',
        name='motion_delete',
    ),

    url(r'^(?P<pk>\d+)/version/(?P<version_number>\d+)/$',
        'motion_detail',
        name='motion_version_detail',
    ),

    url(r'^(?P<pk>\d+)/version/(?P<version_number>\d+)/permit/$',
        'version_permit',
        name='motion_version_permit',
    ),

    url(r'^(?P<pk>\d+)/version/(?P<version_number>\d+)/del/$',
        'version_delete',
        name='motion_version_delete',
    ),

    url(r'^(?P<pk>\d+)/diff/$',
        'version_diff',
        name='motion_version_diff',
    ),

    url(r'^(?P<pk>\d+)/support/$',
        'motion_support',
        name='motion_support',
    ),

    url(r'^(?P<pk>\d+)/unsupport/$',
        'motion_unsupport',
        name='motion_unsupport',
    ),

    url(r'^(?P<pk>\d+)/create_poll/$',
        'poll_create',
        name='motion_poll_create',
    ),

    url(r'^(?P<pk>\d+)/poll/(?P<poll_number>\d+)/edit/$',
        'poll_edit',
        name='motion_poll_edit',
    ),

    url(r'^(?P<pk>\d+)/poll/(?P<poll_number>\d+)/del/$',
        'poll_delete',
        name='motion_poll_delete',
    ),

    url(r'^(?P<pk>\d+)/poll/(?P<poll_number>\d+)/pdf/$',
        'poll_pdf',
        name='motion_poll_pdf',
    ),

    url(r'^(?P<pk>\d+)/set_state/(?P<state>\d+)/$',
        'set_state',
        name='motion_set_state',
    ),

    url(r'^(?P<pk>\d+)/reset_state/$',
        'reset_state',
        name='motion_reset_state',
    ),

    url(r'^(?P<pk>\d+)/agenda/$',
        'create_agenda_item',
        name='motion_create_agenda',
    ),

    url(r'^pdf/$',
        'motion_list_pdf',
        name='motion_list_pdf',
    ),

    url(r'^(?P<pk>\d+)/pdf/$',
        'motion_detail_pdf',
        name='motion_detail_pdf',
    ),

    url(r'^category/$',
        'category_list',
        name='motion_category_list',
    ),

    url(r'^category/new/$',
        'category_create',
        name='motion_category_create',
    ),

    url(r'^category/(?P<pk>\d+)/edit/$',
        'category_update',
        name='motion_category_update',
    ),

    url(r'^category/(?P<pk>\d+)/del/$',
        'category_delete',
        name='motion_category_delete',
    ),

    url(r'^csv_import/$',
        'motion_csv_import',
        name='motion_csv_import',
    ),
)
