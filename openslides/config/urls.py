#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.config.urls
    ~~~~~~~~~~~~~~~~~~~~~~

    URL list for the config app.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.conf.urls.defaults import *
from django.utils.importlib import import_module

import settings

from views import GeneralConfig, VersionConfig

urlpatterns = patterns('config.views',
    url(r'^general/$',
        GeneralConfig.as_view(),
        name='config_general',
    ),

    url(r'^version/$',
        VersionConfig.as_view(),
        name='config_version',
    ),
)

for app in settings.INSTALLED_APPS:
    try:
        mod = import_module(app + '.views')
    except ImportError:
        continue
    appname = mod.__name__.split('.')[0]
    try:
        urlpatterns += patterns('', url(
            r'^%s/$' % appname,
            mod.Config.as_view(),
            name='config_%s' % appname,
        ))
    except AttributeError:
        continue

