# -*- coding: utf-8 -*-

from django.conf.urls import patterns, url

from openslides.utils.views import RedirectView

from . import views

urlpatterns = patterns(
    '',
    # Redirect to dashboard URL
    url(r'^$',
        RedirectView.as_view(url_name='core_dashboard'),
        name='home',),

    url(r'^dashboard/$',
        views.DashboardView.as_view(),
        name='core_dashboard'),

    url(r'^dashboard/select_widgets/$',
        views.SelectWidgetsView.as_view(),
        name='core_select_widgets'),

    url(r'^version/$',
        views.VersionView.as_view(),
        name='core_version',),

    url(r'^search/$',
        views.SearchView(),
        name='core_search',))
