# -*- coding: utf-8 -*-

from django.conf.urls import patterns, url

from . import views

urlpatterns = patterns(
    '',
    url(r'^$',
        views.AssignmentListView.as_view(),
        name='assignment_list'),

    url(r'^(?P<pk>\d+)/$',
        views.AssignmentDetail.as_view(),
        name='assignment_detail'),

    url(r'^new/$',
        views.AssignmentCreateView.as_view(),
        name='assignment_create'),

    url(r'^(?P<pk>\d+)/edit/$',
        views.AssignmentUpdateView.as_view(),
        name='assignment_update'),

    url(r'^(?P<pk>\d+)/del/$',
        views.AssignmentDeleteView.as_view(),
        name='assignment_delete'),

    url(r'^(?P<pk>\d+)/setstatus/(?P<status>[a-z]{3})/$',
        views.AssignmentSetStatusView.as_view(),
        name='assignment_set_status'),

    url(r'^(?P<pk>\d+)/run/$',
        views.AssignmentRunView.as_view(),
        name='assignment_run'),

    url(r'^(?P<pk>\d+)/delrun/$',
        views.AssignmentRunDeleteView.as_view(),
        name='assignment_delrun'),

    url(r'^(?P<pk>\d+)/delother/(?P<user_id>[^/]+)/$',
        views.AssignmentRunOtherDeleteView.as_view(),
        name='assignment_delother'),

    url(r'^(?P<pk>\d+)/agenda/$',
        views.CreateRelatedAgendaItemView.as_view(),
        name='assignment_create_agenda'),

    url(r'^print/$',
        views.AssignmentPDF.as_view(),
        name='assignment_list_pdf'),

    url(r'^(?P<pk>\d+)/print/$',
        views.AssignmentPDF.as_view(),
        name='assignment_pdf'),

    url(r'^(?P<pk>\d+)/gen_poll/$',
        views.PollCreateView.as_view(),
        name='assignmentpoll_create'),

    url(r'^poll/(?P<poll_id>\d+)/edit/$',
        views.PollUpdateView.as_view(),
        name='assignmentpoll_update'),

    url(r'^poll/(?P<pk>\d+)/del/$',
        views.AssignmentPollDeleteView.as_view(),
        name='assignmentpoll_delete'),

    url(r'^poll/(?P<poll_id>\d+)/print/$',
        views.AssignmentPollPDF.as_view(),
        name='assignmentpoll_pdf'),

    # TODO: use seperate urls to publish and unpublish the poll
    #       see assignment_user_elected
    url(r'^poll/(?P<pk>\d+)/pub/$',
        views.SetPublishStatusView.as_view(),
        name='assignmentpoll_publish_status'),

    url(r'^(?P<pk>\d+)/elected/(?P<user_id>[^/]+)/$',
        views.SetElectedView.as_view(),
        {'elected': True},
        name='assignment_user_elected'),

    url(r'^(?P<pk>\d+)/notelected/(?P<user_id>[^/]+)/$',
        views.SetElectedView.as_view(),
        {'elected': False},
        name='assignment_user_not_elected')
)
