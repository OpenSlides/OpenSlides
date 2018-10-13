from typing import Any, Dict, List

from rest_framework.response import Response
from rest_framework.views import APIView as _APIView


class APIView(_APIView):
    """
    The Django Rest framework APIView with improvements for OpenSlides.
    """

    http_method_names: List[str] = []
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
