from django.conf.urls import include, patterns, url

from openslides.core.views import IndexView, ErrorView
from openslides.users.views import UserSettingsView, UserPasswordSettingsView
from openslides.utils.rest_api import router

handler403 = ErrorView.as_view(status_code=403)
handler404 = ErrorView.as_view(status_code=404)
handler500 = ErrorView.as_view(status_code=500)

urlpatterns = patterns(
    '',
    url(r'^', include('openslides.core.urls')),
    url(r'^core.*', IndexView.as_view()),
    url(r'^rest/', include(router.urls)),
    url(r'^users/', include('openslides.users.urls')),
    url(r'^users.*', IndexView.as_view()),
    url(r'^assignments/', include('openslides.assignments.urls')),
    url(r'^assignments.*', IndexView.as_view()),
    url(r'^agenda/', include('openslides.agenda.urls')),
    url(r'^agenda.*', IndexView.as_view()),
    url(r'^motions/', include('openslides.motions.urls')),
    url(r'^motions.*', IndexView.as_view()),
    url(r'^mediafiles/', include('openslides.mediafiles.urls')),
    url(r'^mediafiles.*', IndexView.as_view()),

    # TODO: all patterns end with ".*" can be removed after we add the global
    # url-pattern "/" to the indexView

    # Activate next lines to get more AngularJS views
    # url(r'^$', IndexView.as_view()),
)

# Deprecated urls. Move them up when the apps are refactored.
urlpatterns += patterns(
    '',
    (r'^config/', include('openslides.config.urls')),
    (r'^projector/', include('openslides.projector.urls')),
    (r'^i18n/', include('django.conf.urls.i18n')),
    (r'^ckeditor/', include('ckeditor.urls')),
)

# TODO: Move these patterns into core or the users app.
urlpatterns += patterns(
    '',
    url(r'^myusersettings/$',
        UserSettingsView.as_view(),
        name='user_settings'),
    url(r'^myusersettings/changepassword/$',
        UserPasswordSettingsView.as_view(),
        name='password_change'),
)
