#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.projector.urls
    ~~~~~~~~~~~~~~~~~~~~~~~~~

    URL list for the projector app.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.conf.urls import patterns, url

from . import views

urlpatterns = patterns(
    '',
    url(r'^$',
        views.Projector.as_view(),
        name='projector_show'),

    url(r'^preview/$',
        views.Projector.as_view(),
        {'callback': None},
        name='projctor_preview_welcomepage'),

    url(r'^preview/(?P<callback>[^/]*)/$',
        views.Projector.as_view(),
        name='projector_preview'),

    url(r'^activate/(?P<callback>[^/]*)/$',
        views.ActivateView.as_view(),
        name='projector_activate_slide'),

    url(r'^dashboard/$',
        views.DashboardView.as_view(),
        name='dashboard'),

    url(r'^widgets/$',
        views.SelectWidgetsView.as_view(),
        name='projector_select_widgets'),

    url(r'^overlay_message/$',
        views.OverlayMessageView.as_view(),
        name='projector_overlay_message'),

    url(r'^new/$',
        views.CustomSlideCreateView.as_view(),
        name='customslide_new'),

    url(r'^(?P<pk>\d+)/edit/$',
        views.CustomSlideUpdateView.as_view(),
        name='customslide_edit'),

    url(r'^(?P<pk>\d+)/del/$',
        views.CustomSlideDeleteView.as_view(),
        name='customslide_delete'),

    url(r'^bigger/$',
        views.ProjectorEdit.as_view(),
        {'direction': 'bigger'},
        name='projector_bigger'),

    url(r'^smaller/$',
        views.ProjectorEdit.as_view(),
        {'direction': 'smaller'},
        name='projector_smaller'),

    url(r'^up/$',
        views.ProjectorEdit.as_view(),
        {'direction': 'up'},
        name='projector_up'),

    url(r'^down/$',
        views.ProjectorEdit.as_view(),
        {'direction': 'down'},
        name='projector_down'),

    url(r'^clean/$',
        views.ProjectorEdit.as_view(),
        {'direction': 'clean'},
        name='projector_clean'),

    url(r'^countdown/reset/$',
        views.CountdownEdit.as_view(),
        {'command': 'reset'},
        name='countdown_reset'),

    url(r'^countdown/start/$',
        views.CountdownEdit.as_view(),
        {'command': 'start'},
        name='countdown_start'),

    url(r'^countdown/stop/$',
        views.CountdownEdit.as_view(),
        {'command': 'stop'},
        name='countdown_stop'),

    url(r'^countdown/set-default/$',
        views.CountdownEdit.as_view(),
        {'command': 'set-default'},
        name='countdown_set_default'),

    url('^overlay/(?P<name>[^/]*)/activate/$',
        views.ActivateOverlay.as_view(),
        {'activate': True},
        name='projector_overlay_activate'),

    url('^overlay/(?P<name>[^/]*)/deactivate/$',
        views.ActivateOverlay.as_view(),
        {'activate': False},
        name='projector_overlay_deactivate'),
)
