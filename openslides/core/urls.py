from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'^core/servertime/$',
        views.ServerTime.as_view(),
        name='core_servertime'),

    url(r'^core/version/$',
        views.VersionView.as_view(),
        name='core_version'),

    url(r'^core/encode_media/$',
        views.MediaEncoder.as_view(),
        name="core_mediaencoding"),

    url(r'^webclient/(?P<realm>site|projector)/$',
        views.WebclientJavaScriptView.as_view(),
        name='core_webclient_javascript'),

    # View for the projectors are handled by angular.
    url(r'^projector/(\d+)/$', views.ProjectorView.as_view()),

    # Original view without resolutioncontrol for the projectors are handled by angular.
    url(r'^real-projector/(\d+)/$', views.RealProjectorView.as_view()),

    # Main entry point for all angular pages.
    # Has to be the last entry in the urls.py
    url(r'^.*$', views.IndexView.as_view()),

]
