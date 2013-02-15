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

from openslides.projector.views import (DashboardView, ActivateView,
    CustomSlideCreateView, CustomSlideUpdateView, CustomSlideDeleteView,
    CountdownEdit, ProjectorEdit, Projector, ActivateOverlay, SelectWidgetsView,
    OverlayMessageView)


urlpatterns = patterns('',
    url(r'^$',
        Projector.as_view(),
        {'sid': None},
        name='projector_show',
    ),

    url(r'^preview/$',
        Projector.as_view(),
        {'sid': None},
        name='projctor_preview_welcomepage',
    ),

    url(r'^preview/(?P<sid>[^/]*)/$',
        Projector.as_view(),
        name='projctor_preview_slide',
    ),

    url(r'^dashboard/$',
        DashboardView.as_view(),
        name='dashboard',
    ),

    url(r'^activate/$',
        ActivateView.as_view(),
        {'sid': None},
        name='projector_activate_welcomepage',
    ),

    url(r'^activate/(?P<sid>[^/]*)/$',
        ActivateView.as_view(),
        name='projector_activate_slide',
    ),

    url(r'^activate/(?P<sid>[^/]*)/(?P<argument>[^/]*)/$',
        ActivateView.as_view(),
        name='projector_activate_slide',
    ),

    url(r'^widgets/$',
        SelectWidgetsView.as_view(),
        name='projector_select_widgets',
    ),

    url(r'^overlay_message/$',
        OverlayMessageView.as_view(),
        name='projector_overlay_message',
    ),

    url(r'^new/$',
        CustomSlideCreateView.as_view(),
        name='customslide_new',
    ),

    url(r'^(?P<pk>\d+)/edit/$',
        CustomSlideUpdateView.as_view(),
        name='customslide_edit',
    ),

    url(r'^(?P<pk>\d+)/del/$',
        CustomSlideDeleteView.as_view(),
        name='customslide_delete',
    ),

    url(r'^bigger/$',
        ProjectorEdit.as_view(),
        {'direction': 'bigger'},
        name='projector_bigger',
    ),

    url(r'^smaller/$',
        ProjectorEdit.as_view(),
        {'direction': 'smaller'},
        name='projector_smaller',
    ),

    url(r'^up/$',
        ProjectorEdit.as_view(),
        {'direction': 'up'},
        name='projector_up',
    ),

    url(r'^down/$',
        ProjectorEdit.as_view(),
        {'direction': 'down'},
        name='projector_down',
    ),

    url(r'^clean/$',
        ProjectorEdit.as_view(),
        {'direction': 'clean'},
        name='projector_clean',
    ),

    url(r'^countdown/reset/$',
        CountdownEdit.as_view(),
         {'command': 'reset'},
        name='countdown_reset',
    ),

    url(r'^countdown/start/$',
        CountdownEdit.as_view(),
         {'command': 'start'},
        name='countdown_start',
    ),

    url(r'^countdown/stop/$',
        CountdownEdit.as_view(),
         {'command': 'stop'},
        name='countdown_stop',
    ),

    url(r'^countdown/set-default/$',
        CountdownEdit.as_view(),
         {'command': 'set-default'},
        name='countdown_set_default',
    ),

    url('^overlay/(?P<name>[^/]*)/activate/$',
        ActivateOverlay.as_view(),
        {'activate': True},
        name='projector_overlay_activate',
    ),

    url('^overlay/(?P<name>[^/]*)/deactivate/$',
        ActivateOverlay.as_view(),
        {'activate': False},
        name='projector_overlay_deactivate',
    ),
)
