# -*- coding: utf-8 -*-

from django.conf.urls import patterns, url

from openslides.utils.views import RedirectView

from . import views

urlpatterns = patterns(
    '',
    # Redirect to dashboard URL
    url(r'^$',
        RedirectView.as_view(url='projector/dashboard/'),
        name='home',),

    url(r'^version/$',
        views.VersionView.as_view(),
        name='core_version',),

    url(r'^search/$',
        views.SearchView(),
        name='search',),
)
