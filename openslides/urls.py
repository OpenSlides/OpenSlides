from django.conf.urls import include, patterns, url

from openslides.core.views import IndexView, ErrorView
from openslides.utils.rest_api import router
from openslides.users.views import UserSettingsView, UserPasswordSettingsView

handler403 = ErrorView.as_view(status_code=403)
handler404 = ErrorView.as_view(status_code=404)
handler500 = ErrorView.as_view(status_code=500)

urlpatterns = patterns(
    '',
    url(r'^rest/', include(router.urls)),
    # TODO: add "special" urls, for example pdf views etc.

    url(r'^user.*', IndexView.as_view()),
)


# Deprecated.
js_info_dict = {'packages': []}


urlpatterns += patterns(
    '',
    (r'^agenda/', include('openslides.agenda.urls')),
    (r'^motion/', include('openslides.motion.urls')),
    (r'^assignment/', include('openslides.assignment.urls')),
    (r'^user/', include('openslides.users.urls')),
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
        'openslides.users.views.login',
        name='user_login'),

    url(r'^logout/$',
        'django.contrib.auth.views.logout_then_login',
        name='user_logout'),

    url(r'^myusersettings/$',
        UserSettingsView.as_view(),
        name='user_settings'),

    url(r'^myusersettings/changepassword/$',
        UserPasswordSettingsView.as_view(),
        name='password_change'),
)

urlpatterns += patterns(
    '',
    (r'^', include('openslides.core.urls')),
)
