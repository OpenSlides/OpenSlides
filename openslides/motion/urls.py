# -*- coding: utf-8 -*-

from django.conf.urls import patterns, url

from . import views

# TODO: define the Views inhere
urlpatterns = patterns(
    'openslides.motion.views',
    url(r'^$',
        views.MotionListView.as_view(),
        name='motion_list'),

    url(r'^new/$',
        views.MotionCreateView.as_view(),
        name='motion_create'),

    url(r'^(?P<pk>\d+)/$',
        views.MotionDetailView.as_view(),
        name='motion_detail'),

    url(r'^(?P<pk>\d+)/edit/$',
        views.MotionUpdateView.as_view(),
        name='motion_update'),

    url(r'^(?P<pk>\d+)/del/$',
        views.MotionDeleteView.as_view(),
        name='motion_delete'),

    url(r'^(?P<pk>\d+)/new_amendment/$',
        views.MotionCreateAmendmentView.as_view(),
        name='motion_create_amendment'),

    url(r'^(?P<pk>\d+)/version/(?P<version_number>\d+)/$',
        views.MotionDetailView.as_view(),
        name='motion_version_detail'),

    url(r'^(?P<pk>\d+)/version/(?P<version_number>\d+)/permit/$',
        views.VersionPermitView.as_view(),
        name='motion_version_permit'),

    url(r'^(?P<pk>\d+)/version/(?P<version_number>\d+)/del/$',
        views.VersionDeleteView.as_view(),
        name='motion_version_delete'),

    url(r'^(?P<pk>\d+)/diff/$',
        views.VersionDiffView.as_view(),
        name='motion_version_diff'),

    url(r'^(?P<pk>\d+)/support/$',
        views.SupportView.as_view(support=True),
        name='motion_support'),

    url(r'^(?P<pk>\d+)/unsupport/$',
        views.SupportView.as_view(support=False),
        name='motion_unsupport'),

    url(r'^(?P<pk>\d+)/create_poll/$',
        views.PollCreateView.as_view(),
        name='motionpoll_create'),

    url(r'^(?P<pk>\d+)/poll/(?P<poll_number>\d+)/edit/$',
        views.PollUpdateView.as_view(),
        name='motionpoll_update'),

    url(r'^(?P<pk>\d+)/poll/(?P<poll_number>\d+)/del/$',
        views.PollDeleteView.as_view(),
        name='motionpoll_delete'),

    url(r'^(?P<pk>\d+)/poll/(?P<poll_number>\d+)/pdf/$',
        views.PollPDFView.as_view(),
        name='motionpoll_pdf'),

    url(r'^(?P<pk>\d+)/set_state/(?P<state>\d+)/$',
        views.MotionSetStateView.as_view(),
        name='motion_set_state'),

    url(r'^(?P<pk>\d+)/reset_state/$',
        views.MotionSetStateView.as_view(reset=True),
        name='motion_reset_state'),

    url(r'^(?P<pk>\d+)/agenda/$',
        views.CreateRelatedAgendaItemView.as_view(),
        name='motion_create_agenda'),

    url(r'^pdf/$',
        views.MotionPDFView.as_view(print_all_motions=True),
        name='motion_list_pdf'),

    url(r'^(?P<pk>\d+)/pdf/$',
        views.MotionPDFView.as_view(print_all_motions=False),
        name='motion_detail_pdf'),

    url(r'^category/$',
        views.CategoryListView.as_view(),
        name='motion_category_list'),

    url(r'^category/new/$',
        views.CategoryCreateView.as_view(),
        name='motion_category_create'),

    url(r'^category/(?P<pk>\d+)/edit/$',
        views.CategoryUpdateView.as_view(),
        name='motion_category_update'),

    url(r'^category/(?P<pk>\d+)/del/$',
        views.CategoryDeleteView.as_view(),
        name='motion_category_delete'),

    url(r'^csv_import/$',
        views.MotionCSVImportView.as_view(),
        name='motion_csv_import'),
)
