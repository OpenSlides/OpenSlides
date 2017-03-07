from django.views import generic as django_views
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework.response import Response
from rest_framework.views import APIView as _APIView

View = django_views.View


class CSRFMixin:
    """
    Adds the csrf cookie to the response.
    """

    @classmethod
    def as_view(cls, *args, **kwargs):
        view = super().as_view(*args, **kwargs)
        return ensure_csrf_cookie(view)


class APIView(_APIView):
    """
    The Django Rest framework APIView with improvements for OpenSlides.
    """

    http_method_names = []
    """
    The allowed actions have to be explicitly defined.

    Django allowes the following:
    http_method_names = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace']
    """

    def get_context_data(self, **context):
        """
        Returns the context for the response.
        """
        return context

    def method_call(self, request, *args, **kwargs):
        """
        Http method that returns the response object with the context data.
        """
        return Response(self.get_context_data())

    # Add the http-methods and delete the method "method_call"
    get = post = put = patch = delete = head = options = trace = method_call
    del method_call
