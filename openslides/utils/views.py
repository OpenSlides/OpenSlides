import base64
from typing import Any, Dict, List  # noqa

from django.contrib.staticfiles import finders
from django.core.exceptions import ImproperlyConfigured
from django.http import HttpResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.generic.base import View
from rest_framework.response import Response
from rest_framework.views import APIView as _APIView

from .arguments import arguments


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
    The state dict is used to cache the template. The state variable is static, but the object ID
    is not allowed to change. So the State has to be saved in this dict. Search for 'Borg design
    pattern' for more information.
    """
    template_name = None  # type: str
    state = {}  # type: Dict[str, str]

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

        if self.template_name is None:
            raise ImproperlyConfigured("'template_name' is not provided.")

        no_caching = arguments.get('no_template_caching', False)
        if self.template_name not in self.state or no_caching:
            self.state[self.template_name] = self.load_template()

    def load_template(self) -> str:
        with open(finders.find(self.template_name)) as template:
            return template.read()

    def get(self, *args: Any, **kwargs: Any) -> HttpResponse:
        return HttpResponse(self.state[self.template_name])


class BinaryTemplateView(TemplateView):
    """
    Loads the specified binary template and encode it with base64.
    """
    def load_template(self) -> str:
        with open(finders.find(self.template_name), 'rb') as template:
            return base64.b64encode(template.read()).decode()
