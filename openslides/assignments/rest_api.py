from openslides.utils.rest_api import RESTElement

from . import views


class AssignmentRESTElement(RESTElement):
    viewset = views.AssignmentViewSet


class AssignmentPollRESTElement(RESTElement):
    viewset = views.AssignmentPollViewSet
