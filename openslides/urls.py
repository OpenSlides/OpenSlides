from django.conf.urls import include, patterns, url
from django.views.generic import RedirectView

from openslides.utils.rest_api import router

urlpatterns = patterns(
    '',
    url(r'^(?P<url>.*[^/])$', RedirectView.as_view(url='/%(url)s/')),
    url(r'^rest/', include(router.urls)),
    url(r'^agenda/', include('openslides.agenda.urls')),
    url(r'^assignments/', include('openslides.assignments.urls')),
    url(r'^motions/', include('openslides.motions.urls')),
    url(r'^users/', include('openslides.users.urls')),

    # The urls.py for the core app has to be the last entry in the urls.py
    url(r'^', include('openslides.core.urls')),
)
