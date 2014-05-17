# -*- coding: utf-8 -*-

from django.conf.urls import patterns, url

from openslides.urls import urlpatterns

from . import views


urlpatterns += patterns(
    '',
    url(r'^url_mixin/$',
        views.UrlMixinView.as_view(),
        name='test_url_mixin'),

    url(r'^url_mixin_args/(?P<arg>\d+)/$',
        views.UrlMixinView.as_view(),
        name='test_url_mixin_args'),

    url(r'^login_mixin/$',
        views.LoginMixinView.as_view()),

    url(r'^permission_mixin1/$',
        views.PermissionMixinView.as_view()),

    url(r'^permission_mixin2/$',
        views.PermissionMixinView.as_view(required_permission='permission_string')),

    url(r'^permission_mixin3/$',
        views.PermissionMixinView.as_view(required_permission='agenda.can_see_agenda')),
)
