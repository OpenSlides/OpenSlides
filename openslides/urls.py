from django.conf import settings
from django.conf.urls import include, url
from django.contrib.staticfiles.urls import urlpatterns
from django.views.generic import RedirectView

from openslides.mediafiles.views import protected_serve
from openslides.utils.rest_api import router

from .core import views as core_views


# Urls for /static/ are already in urlpatterns

urlpatterns += [
    # URLs for /media/
    url(r'^%s(?P<path>.*)$' % settings.MEDIA_URL.lstrip('/'), protected_serve, {'document_root': settings.MEDIA_ROOT}),

    # When a url without a leading slash is requested, redirect to the url with
    # the slash. This line has to be after static and media files.
    url(r'^(?P<url>.*[^/])$', RedirectView.as_view(url='/%(url)s/', permanent=True)),

    # URLs for the rest system
    url(r'^rest/', include(router.urls)),

    # Other urls defined by modules and plugins
    url(r'^apps/', include('openslides.urls_apps')),

    # The old angular webclient
    # TODO: Change me or at least my comment
    url(r'^webclient/(?P<realm>site|projector)/$',
        core_views.WebclientJavaScriptView.as_view(),
        name='core_webclient_javascript'),

    # View for the projectors are handled by angular.
    url(r'^projector/(\d+)/$', core_views.ProjectorView.as_view()),

    # Original view without resolutioncontrol for the projectors are handled by angular.
    url(r'^real-projector/(\d+)/$', core_views.RealProjectorView.as_view()),

    # Main entry point for all angular pages.
    # Has to be the last entry in the urls.py
    url(r'^.*$', core_views.IndexView.as_view(), name="index"),
]
