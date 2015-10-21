from django.conf.urls import patterns, url

from . import views

urlpatterns = patterns(
    '',
    url(r'^core/url_patterns/$',
        views.UrlPatternsView.as_view(),
        name='core_url_patterns'),

    url(r'^core/servertime/$',
        views.ServerTime.as_view(),
        name='core_servertime'),

    url(r'^core/version/$',
        views.VersionView.as_view(),
        name='core_version'),

    url(r'^webclient/(?P<realm>site|projector)/$',
        views.WebclientJavaScriptView.as_view(),
        name='core_webclient_javascript'),

    # View for the projectors are handelt by angular.
    url(r'^projector.*$', views.ProjectorView.as_view()),

    # Main entry point for all angular pages.
    # Has to be the last entry in the urls.py
    url(r'^.*$', views.IndexView.as_view()),
)
