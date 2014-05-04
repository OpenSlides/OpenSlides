# -*- coding: utf-8 -*-

from django.conf.urls import patterns, url

from . import views

urlpatterns = patterns(
    '',
    url(r'^$',
        views.Overview.as_view(),
        name='item_overview'),  # TODO: Rename this to item_list

    url(r'^(?P<pk>\d+)/$',
        views.AgendaItemView.as_view(),
        name='item_view'),

    url(r'^(?P<pk>\d+)/close/$',
        views.SetClosed.as_view(),
        {'closed': True},
        name='item_close'),

    url(r'^(?P<pk>\d+)/open/$',
        views.SetClosed.as_view(),
        {'closed': False},
        name='item_open'),

    url(r'^(?P<pk>\d+)/edit/$',
        views.ItemUpdate.as_view(),
        name='item_edit'),

    url(r'^new/$',
        views.ItemCreate.as_view(),
        name='item_new'),

    url(r'^(?P<pk>\d+)/del/$',
        views.ItemDelete.as_view(),
        name='item_delete'),

    url(r'^print/$',
        views.AgendaPDF.as_view(),
        name='print_agenda'),

    url(r'^numbering/$',
        views.AgendaNumberingView.as_view(),
        name='agenda_numbering'),

    # List of speakers
    url(r'^(?P<pk>\d+)/speaker/$',
        views.SpeakerAppendView.as_view(),
        name='agenda_speaker_append'),

    url(r'^(?P<pk>\d+)/speaker/close/$',
        views.SpeakerListCloseView.as_view(),
        name='agenda_speaker_close'),

    url(r'^(?P<pk>\d+)/speaker/reopen/$',
        views.SpeakerListCloseView.as_view(reopen=True),
        name='agenda_speaker_reopen'),

    url(r'^(?P<pk>\d+)/speaker/del/$',
        views.SpeakerDeleteView.as_view(),
        name='agenda_speaker_delete'),

    url(r'^(?P<pk>\d+)/speaker/(?P<speaker>\d+)/del/$',
        views.SpeakerDeleteView.as_view(),
        name='agenda_speaker_delete'),

    url(r'^(?P<pk>\d+)/speaker/(?P<person_id>[^/]+)/speak/$',
        views.SpeakerSpeakView.as_view(),
        name='agenda_speaker_speak'),

    url(r'^(?P<pk>\d+)/speaker/end_speach/$',
        views.SpeakerEndSpeachView.as_view(),
        name='agenda_speaker_end_speach'),

    url(r'^(?P<pk>\d+)/speaker/change_order/$',
        views.SpeakerChangeOrderView.as_view(),
        name='agenda_speaker_change_order'),

    url(r'^list_of_speakers/$',
        views.CurrentListOfSpeakersView.as_view(),
        name='agenda_current_list_of_speakers'),

    url(r'^list_of_speakers/add/$',
        views.CurrentListOfSpeakersView.as_view(set_speaker=True),
        name='agenda_add_to_current_list_of_speakers'),

    url(r'^list_of_speakers/next/$',
        views.CurrentListOfSpeakersView.as_view(next_speaker=True),
        name='agenda_next_on_current_list_of_speakers'),

    url(r'^list_of_speakers/end_speach/$',
        views.CurrentListOfSpeakersView.as_view(end_speach=True),
        name='agenda_end_speach_on_current_list_of_speakers'),

    url(r'^list_of_speakers/projector/$',
        views.CurrentListOfSpeakersProjectorView.as_view(),
        name='agenda_current_list_of_speakers_projector'),

    url(r'^csv_import/$',
        views.ItemCSVImportView.as_view(),
        name='item_csv_import'))
