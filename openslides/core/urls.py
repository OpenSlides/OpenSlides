from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'^core/url_patterns/$',
        views.UrlPatternsView.as_view(),
        name='core_url_patterns'),

    url(r'^core/servertime/$',
        views.ServerTime.as_view(),
        name='core_servertime'),

    url(r'^core/version/$',
        views.VersionView.as_view(),
        name='core_version'),

    url(r'^core/search_api/$',
        views.SearchView.as_view(),
        name='core_search'),

    #Example code
    url(r'^trigger/$',
        views.TriggerFakeModelAutoupdateView.as_view(),
        name='trigger'),
    #End of example code

    url(r'^angular_js/(?P<openslides_app>site|projector)/$',
        views.AppsJsView.as_view(),
        name='core_apps_js'),

    # View for the projectors are handelt by angular.
    url(r'^projector.*$', views.ProjectorView.as_view()),


    # Main entry point for all angular pages.
    # Has to be the last entry in the urls.py
    url(r'^.*$', views.IndexView.as_view()),
]
