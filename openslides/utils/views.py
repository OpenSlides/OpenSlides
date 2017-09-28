from typing import Any, Dict, List  # noqa

from django.contrib.staticfiles import finders
from django.core.exceptions import ImproperlyConfigured
from django.http import HttpResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.generic.base import View
from rest_framework.response import Response
from rest_framework.views import APIView as _APIView


class CSRFMixin:
    """
    Adds the csrf cookie to the response.
    """

    @classmethod
    def as_view(cls, *args: Any, **kwargs: Any) -> View:
        view = super().as_view(*args, **kwargs)  # type: ignore
        return ensure_csrf_cookie(view)


class APIView(_APIView):
    """
    The Django Rest framework APIView with improvements for OpenSlides.
    """

    http_method_names = []  # type: List[str]
    """
    The allowed actions have to be explicitly defined.

    Django allowes the following:
    http_method_names = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace']
    """

    def get_context_data(self, **context: Any) -> Dict[str, Any]:
        """
        Returns the context for the response.
        """
        return context

    def method_call(self, request: Any, *args: Any, **kwargs: Any) -> Any:
        """
        Http method that returns the response object with the context data.
        """
        return Response(self.get_context_data())

    # Add the http-methods and delete the method "method_call"
    get = post = put = patch = delete = head = options = trace = method_call
    del method_call


class TemplateView(View):
    """
    A view to serve a single cached template file. Subclasses have to provide 'template_name'.
    """
    template_name = None  # type: str

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

        if self.template_name is None:
            raise ImproperlyConfigured("'template_name' is not provided")

        with open(finders.find(self.template_name)) as template:
            self.template = template.read()

    def get(self, *args: Any, **kwargs: Any) -> HttpResponse:
        return HttpResponse(self.template)
