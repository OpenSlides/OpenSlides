#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.agenda.urls
    ~~~~~~~~~~~~~~~~~~~~~~

    URL list for the agenda app.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.conf.urls import url, patterns
from openslides.agenda.views import (
    Overview, AgendaItemView, SetClosed, ItemUpdate, SpeakerSpeakView,
    ItemCreate, ItemDelete, AgendaPDF, SpeakerAppendView, SpeakerDeleteView,
    SpeakerListOpenView, SpeakerChangeOrderView)

urlpatterns = patterns(
    '',
    url(r'^$',
        Overview.as_view(),
        name='item_overview',
    ),

    url(r'^(?P<pk>\d+)/$',
        AgendaItemView.as_view(),
        name='item_view',
    ),

    url(r'^(?P<pk>\d+)/close/$',
        SetClosed.as_view(),
        {'closed': True},
        name='item_close',
    ),

    url(r'^(?P<pk>\d+)/open/$',
        SetClosed.as_view(),
        {'closed': False},
        name='item_open',
    ),

    url(r'^(?P<pk>\d+)/edit/$',
        ItemUpdate.as_view(),
        name='item_edit',
    ),

    url(r'^new/$',
        ItemCreate.as_view(),
        name='item_new',
    ),

    url(r'^(?P<pk>\d+)/del/$',
        ItemDelete.as_view(),
        name='item_delete',
    ),

    url(r'^print/$',
        AgendaPDF.as_view(),
        name='print_agenda',
    ),

    # Speaker List
    url(r'^(?P<pk>\d+)/speaker/$',
        SpeakerAppendView.as_view(),
        name='agenda_speaker_append',
    ),

    url(r'^(?P<pk>\d+)/speaker/open/$',
        SpeakerListOpenView.as_view(open_list=True),
        name='agenda_speaker_open',
    ),

    url(r'^(?P<pk>\d+)/speaker/close/$',
        SpeakerListOpenView.as_view(),
        name='agenda_speaker_close',
    ),

    url(r'^(?P<pk>\d+)/speaker/del/$',
        SpeakerDeleteView.as_view(),
        name='agenda_speaker_delete',
    ),

    url(r'^(?P<pk>\d+)/speaker/(?P<speaker>\d+)/del/$',
        SpeakerDeleteView.as_view(),
        name='agenda_speaker_delete',
    ),

    url(r'^(?P<pk>\d+)/speaker/(?P<person_id>[^/]+)/speak/$',
        SpeakerSpeakView.as_view(),
        name='agenda_speaker_speak',
    ),

    url(r'^(?P<pk>\d+)/speaker/change_order$',
        SpeakerChangeOrderView.as_view(),
        name='agenda_speaker_change_order',
    ),
)
