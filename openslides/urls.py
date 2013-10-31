# -*- coding: utf-8 -*-

from django.conf import settings
from django.conf.urls import include, patterns, url
from django.utils.importlib import import_module

handler500 = 'openslides.utils.views.server_error'

urlpatterns = patterns(
    '',
    (r'^agenda/', include('openslides.agenda.urls')),
    (r'^motion/', include('openslides.motion.urls')),
    (r'^assignment/', include('openslides.assignment.urls')),
    (r'^participant/', include('openslides.participant.urls')),
    (r'^mediafile/', include('openslides.mediafile.urls')),
    (r'^config/', include('openslides.config.urls')),
    (r'^projector/', include('openslides.projector.urls')),
    (r'^i18n/', include('django.conf.urls.i18n')),
)

js_info_dict = {'packages': []}

for plugin in settings.INSTALLED_PLUGINS:
    try:
        mod = import_module(plugin + '.urls')
    except ImportError:
        continue

    plugin_name = mod.__name__.split('.')[0]
    urlpatterns += patterns('', (r'^%s/' % plugin_name, include('%s.urls'
                                                                % plugin)))
    js_info_dict['packages'].append(plugin)

# TODO: move this patterns into core or the participant app
urlpatterns += patterns(
    '',
    (r'^jsi18n/$', 'django.views.i18n.javascript_catalog', js_info_dict),

    url(r'^login/$',
        'openslides.participant.views.login',
        name='user_login'),

    url(r'^logout/$',
        'django.contrib.auth.views.logout_then_login',
        name='user_logout'),

    url(r'^usersettings/$',
        'openslides.participant.views.user_settings',
        name='user_settings'),

    url(r'^usersettings/changepassword/$',
        'openslides.participant.views.user_settings_password',
        name='password_change'),
)

urlpatterns += patterns(
    '',
    (r'^', include('openslides.core.urls')),
)
