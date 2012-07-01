#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.projector.urls
    ~~~~~~~~~~~~~~~~~~~~~~~~

    URL list for the projector app.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.conf.urls.defaults import *

from openslides.utils.views import CreateView

from openslides.projector.models import ProjectorSlide
from openslides.projector.views import (ControlView, ActivateView,
    CustomSlideCreateView, CustomSlideUpdateView, CustomSlideDeleteView,
    CountdownEdit, ProjectorEdit, Projector)



urlpatterns = patterns('projector.views',
    url(r'^$',
        Projector.as_view(),
        {'sid': None},
        name='projector_show',
    ),

    url(r'^preview/(?P<sid>[^/]*)/$',
        Projector.as_view(),
        name='projctor_preview_slide',
    ),

    url(r'^control/$',
        ControlView.as_view(),
        name='projector_control',
    ),

    url(r'^activate/(?P<sid>[^/]*)/$',
        ActivateView.as_view(),
        name='projector_activate_slide',
    ),

    url(r'^activate/(?P<sid>[^/]*)/summary/$',
        ActivateView.as_view(),
        {'summary': True},
        name='projector_activate_summary',
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

# TODO: Merge the following lines with this one:
    ## url(r'^countdown/(?P<command>[^/]*)/$',
        ## CountdownEdit.as_view(),
        ## name='countdown_edit',
    ## ),



    url(r'^countdown/show/$',
        CountdownEdit.as_view(),
         {'command': 'show'},
        name='countdown_open',
    ),

    url(r'^countdown/hide/$',
        CountdownEdit.as_view(),
         {'command': 'hide'},
        name='countdown_close',
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
)
