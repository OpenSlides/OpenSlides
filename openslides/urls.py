#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.urls
    ~~~~~~~~~~~~~~~

    Global URL list for OpenSlides.

    :copyright: 2011 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.conf.urls.defaults import patterns, url, include
from django.conf import settings
from django.utils.importlib import import_module
import settings

from utils.views import FrontPage


handler500 = 'openslides.utils.views.server_error'


urlpatterns = patterns('',
    # frontpage
    (r'^$', FrontPage.as_view()),

    (r'^agenda/', include('agenda.urls')),
    (r'^application/', include('application.urls')),
    (r'^assignment/', include('assignment.urls')),
    (r'^participant/', include('participant.urls')),
    (r'^config/', include('config.urls')),
    (r'^projector/', include('projector.urls')),
    (r'^i18n/', include('django.conf.urls.i18n')),
)

js_info_dict = {
    'packages': [],
}

for plugin in settings.INSTALLED_PLUGINS:
    try:
        mod = import_module(plugin + '.urls')
    except ImportError, err:
        continue

    plugin_name = mod.__name__.split('.')[0]
    urlpatterns += patterns('', (r'^%s/' % plugin_name, include('%s.urls' % plugin_name)))
    js_info_dict['packages'].append(plugin_name)


urlpatterns += patterns('',
    (r'^500/$', 'openslides.utils.views.server_error'),
    (r'^jsi18n/$', 'django.views.i18n.javascript_catalog', js_info_dict),

    url(r'^login/$',
        'django.contrib.auth.views.login',
        {'template_name': 'participant/login.html'},
        name='user_login',
    ),

    url(r'^logout/$',
        'django.contrib.auth.views.logout_then_login',
        name='user_logout',
    )
)
