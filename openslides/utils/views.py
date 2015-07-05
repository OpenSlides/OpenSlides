from io import BytesIO

from django.core.exceptions import PermissionDenied
from django.http import HttpResponse
from django.utils.translation import ugettext_lazy
from django.views import generic as django_views
from django.views.decorators.csrf import ensure_csrf_cookie
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Spacer
from rest_framework.response import Response
from rest_framework.views import APIView as _APIView

from .pdf import firstPage, laterPages

View = django_views.View


class SingleObjectMixin(django_views.detail.SingleObjectMixin):
    """
    Mixin for single objects from the database.
    """

    def dispatch(self, *args, **kwargs):
        if not hasattr(self, 'object'):
            # Save the object not only in the cache but in the public
            # attribute self.object because Django expects this later.
            # Because get_object() has an internal cache this line is not a
            # performance problem.
            self.object = self.get_object()
        return super().dispatch(*args, **kwargs)

    def get_object(self, *args, **kwargs):
        """
        Returns the single object from database or cache.
        """
        try:
            obj = self._object
        except AttributeError:
            obj = super().get_object(*args, **kwargs)
            self._object = obj
        return obj


class CSRFMixin:
    """
    Adds the csrf cookie to the response.
    """

    @classmethod
    def as_view(cls, *args, **kwargs):
        view = super().as_view(*args, **kwargs)
        return ensure_csrf_cookie(view)


class PDFView(View):
    """
    View to generate an PDF.
    """
    filename = ugettext_lazy('undefined-filename')
    top_space = 3
    document_title = None
    required_permission = None

    def check_permission(self, request, *args, **kwargs):
        """
        Checks if the user has the required permission.
        """
        if self.required_permission is None:
            return True
        else:
            return request.user.has_perm(self.required_permission)

    def dispatch(self, request, *args, **kwargs):
        """
        Check if the user has the permission.

        If the user is not logged in, redirect the user to the login page.
        """
        if not self.check_permission(request, *args, **kwargs):
            raise PermissionDenied
        return super().dispatch(request, *args, **kwargs)

    def get_top_space(self):
        return self.top_space

    def get_document_title(self):
        if self.document_title:
            return str(self.document_title)
        else:
            return ''

    def get_filename(self):
        return self.filename

    def get_template(self, buffer):
        return SimpleDocTemplate(buffer)

    def build_document(self, pdf_document, story):
        pdf_document.build(
            story, onFirstPage=firstPage, onLaterPages=laterPages)

    def render_to_response(self, filename):
        response = HttpResponse(content_type='application/pdf')
        filename = 'filename=%s.pdf;' % self.get_filename()
        response['Content-Disposition'] = filename.encode('utf-8')

        buffer = BytesIO()
        pdf_document = self.get_template(buffer)
        pdf_document.title = self.get_document_title()
        story = [Spacer(1, self.get_top_space() * cm)]

        self.append_to_pdf(story)

        self.build_document(pdf_document, story)

        pdf = buffer.getvalue()
        buffer.close()
        response.write(pdf)
        return response

    def get(self, request, *args, **kwargs):
        return self.render_to_response(self.get_filename())


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
