# -*- coding: utf-8 -*-

from django.conf.urls import patterns, url

from . import views

urlpatterns = patterns(
    '',
    url(r'^$',
        views.ProjectorView.as_view(),
        name='projector_show'),

    url(r'^preview/(?P<callback>[^/]*)/$',
        views.ProjectorView.as_view(),
        name='projector_preview'),

    url(r'^activate/(?P<callback>[^/]*)/$',
        views.ActivateView.as_view(),
        name='projector_activate_slide'),

    url(r'^overlay_message/$',
        views.OverlayMessageView.as_view(),
        name='projector_overlay_message'),

    url(r'^bigger/$',
        views.ProjectorControllView.as_view(),
        {'direction': 'bigger'},
        name='projector_bigger'),

    url(r'^smaller/$',
        views.ProjectorControllView.as_view(),
        {'direction': 'smaller'},
        name='projector_smaller'),

    url(r'^up/$',
        views.ProjectorControllView.as_view(),
        {'direction': 'up'},
        name='projector_up'),

    url(r'^down/$',
        views.ProjectorControllView.as_view(),
        {'direction': 'down'},
        name='projector_down'),

    url(r'^clean/scale/$',
        views.ProjectorControllView.as_view(),
        {'direction': 'clean_scale'},
        name='projector_clean_scale'),

    url(r'^clean/scroll/$',
        views.ProjectorControllView.as_view(),
        {'direction': 'clean_scroll'},
        name='projector_clean_scroll'),

    url(r'^countdown/reset/$',
        views.CountdownControllView.as_view(),
        {'command': 'reset'},
        name='countdown_reset'),

    url(r'^countdown/start/$',
        views.CountdownControllView.as_view(),
        {'command': 'start'},
        name='countdown_start'),

    url(r'^countdown/stop/$',
        views.CountdownControllView.as_view(),
        {'command': 'stop'},
        name='countdown_stop'),

    url(r'^countdown/set-default/$',
        views.CountdownControllView.as_view(),
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
