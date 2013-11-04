# -*- coding: utf-8 -*-

from django.conf.urls import patterns, url

from . import views

urlpatterns = patterns(
    '',
    url(r'^$',
        views.MediafileListView.as_view(),
        name='mediafile_list'),

    url(r'^new/$',
        views.MediafileCreateView.as_view(),
        name='mediafile_create'),

    url(r'^(?P<pk>\d+)/edit/$',
        views.MediafileUpdateView.as_view(),
        name='mediafile_update'),

    url(r'^(?P<pk>\d+)/del/$',
        views.MediafileDeleteView.as_view(),
        name='mediafile_delete'),
    url(r'^pdf/next/$', views.PdfNextView.as_view(), name='next_pdf_page'),
    url(r'^pdf/prev/$', views.PdfPreviousView.as_view(), name='prev_pdf_page'),
    url(r'^pdf/target_page/$',
        views.PdfGoToPageView.as_view(),
        name='target_pdf_page'),
    url(r'^pdf/toggle_fullscreen/$',
        views.PdfToggleFullscreenView.as_view(),
        name='toggle_fullscreen')
)
