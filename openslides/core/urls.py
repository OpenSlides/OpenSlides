from django.conf.urls import patterns, url

from . import views

urlpatterns = patterns(
    '',
    url(r'^core/url_patterns/$',
        views.UrlPatternsView.as_view(),
        name='core_url_patterns'),
)
