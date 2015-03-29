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

    url(r'^(?P<pk>\d+)/set_phase/(?P<phase>\d+)/$',
        views.AssignmentSetPhaseView.as_view(),
        name='assignment_set_phase'),

    url(r'^(?P<pk>\d+)/candidate/$',
        views.AssignmentCandidateView.as_view(),
        name='assignment_candidate'),

    url(r'^(?P<pk>\d+)/delete_candidate/$',
        views.AssignmentDeleteCandidateshipView.as_view(),
        name='assignment_del_candidate'),

    url(r'^(?P<pk>\d+)/delother/(?P<user_pk>[^/]+)/$',
        views.AssignmentDeleteCandidateshipOtherView.as_view(),
        name='assignment_del_candidate_other'),

    url(r'^(?P<pk>\d+)/agenda/$',
        views.CreateRelatedAgendaItemView.as_view(),
        name='assignment_create_agenda'),

    url(r'^print/$',
        views.AssignmentPDF.as_view(),
        name='assignment_list_pdf'),

    url(r'^(?P<pk>\d+)/print/$',
        views.AssignmentPDF.as_view(),
        name='assignment_pdf'),

    url(r'^(?P<pk>\d+)/create_poll/$',
        views.PollCreateView.as_view(),
        name='assignmentpoll_create'),

    url(r'^poll/(?P<poll_id>\d+)/edit/$',
        views.PollUpdateView.as_view(),
        name='assignmentpoll_update'),

    url(r'^poll/(?P<pk>\d+)/del/$',
        views.AssignmentPollDeleteView.as_view(),
        name='assignmentpoll_delete'),

    url(r'^poll/(?P<poll_pk>\d+)/print/$',
        views.AssignmentPollPDF.as_view(),
        name='assignmentpoll_pdf'),

    url(r'^poll/(?P<pk>\d+)/pub/$',
        views.SetPublishPollView.as_view(),
        {'publish': True},
        name='assignmentpoll_publish_poll'),

    url(r'^poll/(?P<pk>\d+)/unpub/$',
        views.SetPublishPollView.as_view(),
        {'publish': False},
        name='assignmentpoll_unpublish_poll'),

    url(r'^(?P<pk>\d+)/elected/(?P<user_pk>[^/]+)/$',
        views.SetElectedView.as_view(),
        {'elected': True},
        name='assignment_user_elected'),

    url(r'^(?P<pk>\d+)/notelected/(?P<user_pk>[^/]+)/$',
        views.SetElectedView.as_view(),
        {'elected': False},
        name='assignment_user_not_elected')
)
