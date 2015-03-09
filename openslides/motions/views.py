from django.utils.text import slugify
from django.utils.translation import ugettext as _
from django.shortcuts import get_object_or_404
from reportlab.platypus import SimpleDocTemplate

from openslides.utils.rest_api import ModelViewSet
from openslides.utils.views import (PDFView, SingleObjectMixin)

from .models import (Category, Motion, MotionPoll, Workflow)
from .pdf import motion_poll_to_pdf, motion_to_pdf, motions_to_pdf
from .serializers import CategorySerializer, MotionSerializer, WorkflowSerializer


class MotionViewSet(ModelViewSet):
    """
    API endpoint to list, retrieve, create, update and destroy motions.
    """
    queryset = Motion.objects.all()
    serializer_class = MotionSerializer

    def check_permissions(self, request):
        """
        Calls self.permission_denied() if the requesting user has not the
        permission to see motions and in case of create, update or
        destroy requests the permission to manage motions.
        """
        # TODO: Use motions.can_create permission and
        #       motions.can_support permission to create and update some
        #       objects but restricted concerning the requesting user.
        if (not request.user.has_perm('motions.can_see') or
                (self.action in ('create', 'update', 'destroy') and not
                 request.user.has_perm('motions.can_manage'))):
            self.permission_denied(request)


class PollMixin(object):
    """
    Mixin for the PollUpdateView and the PollDeleteView.
    """

    required_permission = 'motions.can_manage'
    success_url_name = 'motion_detail'

    def get_object(self):
        """
        Return a MotionPoll object.

        Use the motion id and the poll_number from the url kwargs to get the
        object.
        """
        try:
            obj = self._object
        except AttributeError:
            queryset = MotionPoll.objects.filter(
                motion=self.kwargs['pk'],
                poll_number=self.kwargs['poll_number'])
            obj = get_object_or_404(queryset)
            self._object = obj
        return obj

    def get_url_name_args(self):
        """
        Return the arguments to create the url to the success_url.
        """
        return [self.get_object().motion.pk]


class PollPDFView(PollMixin, PDFView):
    """
    Generates a ballotpaper.
    """

    required_permission = 'motions.can_manage'
    top_space = 0

    def get_filename(self):
        """
        Return the filename for the PDF.
        """
        return u'%s%s_%s' % (_("Motion"), str(self.get_object().poll_number), _("Poll"))

    def get_template(self, buffer):
        return SimpleDocTemplate(
            buffer, topMargin=-6, bottomMargin=-6, leftMargin=0, rightMargin=0,
            showBoundary=False)

    def build_document(self, pdf_document, story):
        pdf_document.build(story)

    def append_to_pdf(self, pdf):
        """
        Append PDF objects.
        """
        motion_poll_to_pdf(pdf, self.get_object())


class MotionPDFView(SingleObjectMixin, PDFView):
    """
    Create the PDF for one or for all motions.

    If self.print_all_motions is True, the view returns a PDF with all motions.

    If self.print_all_motions is False, the view returns a PDF with only one
    motion.
    """
    model = Motion
    top_space = 0
    print_all_motions = False

    def check_permission(self, request, *args, **kwargs):
        """
        Checks if the requesting user has the permission to see the motion as
        PDF.
        """
        if self.print_all_motions:
            is_allowed = request.user.has_perm('motions.can_see')
        else:
            is_allowed = self.get_object().get_allowed_actions(request.user)['see']
        return is_allowed

    def get_object(self, *args, **kwargs):
        if self.print_all_motions:
            obj = None
        else:
            obj = super().get_object(*args, **kwargs)
        return obj

    def get_filename(self):
        """
        Return the filename for the PDF.
        """
        if self.print_all_motions:
            return _("Motions")
        else:
            if self.get_object().identifier:
                suffix = self.get_object().identifier.replace(' ', '')
            else:
                suffix = self.get_object().title.replace(' ', '_')
                suffix = slugify(suffix)
            return '%s-%s' % (_("Motion"), suffix)

    def append_to_pdf(self, pdf):
        """
        Append PDF objects.
        """
        if self.print_all_motions:
            motions = []
            for motion in Motion.objects.all():
                if (not motion.state.required_permission_to_see or
                        self.request.user.has_perm(motion.state.required_permission_to_see)):
                    motions.append(motion)
            motions_to_pdf(pdf, motions)
        else:
            motion_to_pdf(pdf, self.get_object())


class CategoryViewSet(ModelViewSet):
    """
    API endpoint to list, retrieve, create, update and destroy categories.
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def check_permissions(self, request):
        """
        Calls self.permission_denied() if the requesting user has not the
        permission to see motions and in case of create, update or destroy
        requests the permission to manage motions.
        """
        if (not request.user.has_perm('motions.can_see') or
                (self.action in ('create', 'update', 'destroy') and not
                 request.user.has_perm('motions.can_manage'))):
            self.permission_denied(request)


class WorkflowViewSet(ModelViewSet):
    """
    API endpoint to list, retrieve, create, update and destroy workflows.
    """
    queryset = Workflow.objects.all()
    serializer_class = WorkflowSerializer

    def check_permissions(self, request):
        """
        Calls self.permission_denied() if the requesting user has not the
        permission to see motions and in case of create, update or destroy
        requests the permission to manage motions.
        """
        if (not request.user.has_perm('motions.can_see') or
                (self.action in ('create', 'update', 'destroy') and not
                 request.user.has_perm('motions.can_manage'))):
            self.permission_denied(request)
