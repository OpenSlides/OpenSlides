from openslides.utils.rest_api import RESTElement

from . import views


class MediafileRESTElement(RESTElement):
    viewset = views.MediafileViewSet
