#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.urls
    ~~~~~~~~~~~~~~~

    Global URL list for OpenSlides.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.conf import settings
from django.conf.urls import patterns, url, include
from django.utils.importlib import import_module

from openslides.utils.views import RedirectView

handler500 = 'openslides.utils.views.server_error'

urlpatterns = patterns('',
    # Redirect to dashboard URL
    url(r'^$', RedirectView.as_view(url='projector/dashboard'), name='home',),

    (r'^agenda/', include('openslides.agenda.urls')),
    (r'^motion/', include('openslides.motion.urls')),
    (r'^assignment/', include('openslides.assignment.urls')),
    (r'^participant/', include('openslides.participant.urls')),
    (r'^config/', include('openslides.config.urls')),
    (r'^projector/', include('openslides.projector.urls')),
    (r'^i18n/', include('django.conf.urls.i18n')),
)

urlpatterns += patterns('django.contrib.staticfiles.views',
    url(r'^static/(?P<path>.*)$', 'serve', {'insecure': True}),
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
    urlpatterns += patterns('', (r'^%s/' % plugin_name, include('%s.urls'
        % plugin_name)))
    js_info_dict['packages'].append(plugin_name)


urlpatterns += patterns('',
    (r'^jsi18n/$', 'django.views.i18n.javascript_catalog', js_info_dict),

    url(r'^login/$',
        'openslides.participant.views.login',
        name='user_login',
    ),

    url(r'^logout/$',
        'django.contrib.auth.views.logout_then_login',
        name='user_logout',
    ),

    url(r'^usersettings/$',
        'openslides.participant.views.user_settings',
        name='user_settings',
    ),

    url(r'^usersettings/changepassword/$',
        'openslides.participant.views.user_settings_password',
        name='password_change',
    ),
)
