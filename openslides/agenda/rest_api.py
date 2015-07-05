from openslides.utils.rest_api import RESTElement

from . import views


class ItemRESTElement(RESTElement):
    viewset = views.ItemViewSet
