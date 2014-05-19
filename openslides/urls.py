# -*- coding: utf-8 -*-

from django.conf import settings
from django.conf.urls import include, patterns, url

from openslides.core.views import ErrorView
from openslides.utils.plugins import get_urlpatterns

handler403 = ErrorView.as_view(status_code=403)
handler404 = ErrorView.as_view(status_code=404)
handler500 = ErrorView.as_view(status_code=500)

urlpatterns = []

js_info_dict = {'packages': []}

for plugin in settings.INSTALLED_PLUGINS:
    plugin_urlpatterns = get_urlpatterns(plugin)
    if plugin_urlpatterns:
        urlpatterns += plugin_urlpatterns
        js_info_dict['packages'].append(plugin)

urlpatterns += patterns(
    '',
    (r'^agenda/', include('openslides.agenda.urls')),
    (r'^motion/', include('openslides.motion.urls')),
    (r'^assignment/', include('openslides.assignment.urls')),
    (r'^participant/', include('openslides.participant.urls')),
    (r'^mediafile/', include('openslides.mediafile.urls')),
    (r'^config/', include('openslides.config.urls')),
    (r'^projector/', include('openslides.projector.urls')),
    (r'^i18n/', include('django.conf.urls.i18n')),
    (r'^ckeditor/', include('ckeditor.urls')),
)

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
