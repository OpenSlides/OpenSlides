from openslides.utils.rest_api import RESTElement

from . import views


class UserRESTElement(RESTElement):
    viewset = views.UserViewSet


class GroupRESTElement(RESTElement):
    viewset = views.GroupViewSet
    app_label = 'users'
    router_prefix = 'group'
