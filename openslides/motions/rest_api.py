from openslides.utils.rest_api import RESTElement

from . import views


class CategoryRESTElement(RESTElement):
    viewset = views.CategoryViewSet


class MotionRESTElement(RESTElement):
    viewset = views.MotionViewSet


class WorkflowRESTElement(RESTElement):
    viewset = views.WorkflowViewSet
