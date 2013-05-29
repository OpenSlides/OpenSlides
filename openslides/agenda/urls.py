#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.agenda.urls
    ~~~~~~~~~~~~~~~~~~~~~~

    URL list for the agenda app.

    :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.conf.urls import url, patterns
from openslides.agenda.views import (
    Overview, AgendaItemView, SetClosed, ItemUpdate, SpeakerSpeakView, SpeakerEndSpeachView,
    ItemCreate, ItemDelete, AgendaPDF, SpeakerAppendView, SpeakerDeleteView,
    SpeakerListCloseView, SpeakerChangeOrderView, CurrentListOfSpeakersView)

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

    # List of speakers
    url(r'^(?P<pk>\d+)/speaker/$',
        SpeakerAppendView.as_view(),
        name='agenda_speaker_append',
    ),

    url(r'^(?P<pk>\d+)/speaker/close/$',
        SpeakerListCloseView.as_view(),
        name='agenda_speaker_close',
    ),

    url(r'^(?P<pk>\d+)/speaker/reopen/$',
        SpeakerListCloseView.as_view(reopen=True),
        name='agenda_speaker_reopen',
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

    url(r'^(?P<pk>\d+)/speaker/end_speach/$',
        SpeakerEndSpeachView.as_view(),
        name='agenda_speaker_end_speach',
    ),

    url(r'^(?P<pk>\d+)/speaker/change_order/$',
        SpeakerChangeOrderView.as_view(),
        name='agenda_speaker_change_order',
    ),

    url(r'^list_of_speakers/$',
        CurrentListOfSpeakersView.as_view(),
        name='agenda_current_list_of_speakers',
    ),

    url(r'^list_of_speakers/add/$',
        CurrentListOfSpeakersView.as_view(set_speaker=True),
        name='agenda_add_to_current_list_of_speakers',
    ),

    url(r'^list_of_speakers/next/$',
        CurrentListOfSpeakersView.as_view(next_speaker=True),
        name='agenda_next_on_current_list_of_speakers',
    ),

    url(r'^list_of_speakers/end_speach/$',
        CurrentListOfSpeakersView.as_view(end_speach=True),
        name='agenda_end_speach_on_current_list_of_speakers',
    )
)
