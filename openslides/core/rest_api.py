from openslides.utils.rest_api import RESTElement

from . import views


class CustomSlideRESTElement(RESTElement):
    viewset = views.CustomSlideViewSet


class ProjectorRestElement(RESTElement):
    viewset = views.ProjectorViewSet


class TagRestElement(RESTElement):
    viewset = views.TagViewSet


class ConfigRestElement(RESTElement):
    viewset = views.ConfigViewSet
    router_prefix = 'config'
    app_label = 'core'
