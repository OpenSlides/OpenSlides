#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.system.urls
    ~~~~~~~~~~~~~~~~~~~~~~

    URL list for the system app.

    :copyright: 2011 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.conf.urls.defaults import *
from django.utils.importlib import import_module

import settings

from views import GeneralConfig

urlpatterns = patterns('system.views',
    url(r'^general/$',
        GeneralConfig.as_view(),
        name='config_general',
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

