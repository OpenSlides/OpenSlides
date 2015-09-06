from django.db import transaction
from django.http import Http404
from django.shortcuts import get_object_or_404
from django.utils.text import slugify
from django.utils.translation import ugettext as _
from django.utils.translation import ugettext_noop
from reportlab.platypus import SimpleDocTemplate
from rest_framework import status

from openslides.core.config import config
from openslides.utils.rest_api import (
    DestroyModelMixin,
    GenericViewSet,
    ModelViewSet,
    Response,
    UpdateModelMixin,
    ValidationError,
    detail_route,
)
from openslides.utils.views import PDFView, SingleObjectMixin

from .exceptions import WorkflowError
from .models import Category, Motion, MotionPoll, MotionVersion, Workflow
from .pdf import motion_poll_to_pdf, motion_to_pdf, motions_to_pdf
from .serializers import (
    CategorySerializer,
    MotionPollSerializer,
    MotionSerializer,
    WorkflowSerializer,
)


# Viewsets for the REST API

class MotionViewSet(ModelViewSet):
    """
    API endpoint for motions.

    There are the following views: metadata, list, retrieve, create,
    partial_update, update, destroy, manage_version, support, set_state and
    create_poll.
    """
    queryset = Motion.objects.all()
    serializer_class = MotionSerializer

    def check_view_permissions(self):
        """
        Returns True if the user has required permissions.
        """
        if self.action in ('metadata', 'list', 'retrieve', 'partial_update', 'update'):
            result = self.request.user.has_perm('motions.can_see')
            # For partial_update and update requests the rest of the check is
            # done in the update method. See below.
        elif self.action == 'create':
            result = (self.request.user.has_perm('motions.can_see') and
                      self.request.user.has_perm('motions.can_create') and
                      (not config['motions_stop_submitting'] or
                       self.request.user.has_perm('motions.can_manage')))
        elif self.action in ('destroy', 'manage_version', 'set_state', 'create_poll'):
            result = (self.request.user.has_perm('motions.can_see') and
                      self.request.user.has_perm('motions.can_manage'))
        elif self.action == 'support':
            result = (self.request.user.has_perm('motions.can_see') and
                      self.request.user.has_perm('motions.can_support'))
        else:
            result = False
        return result

    def create(self, request, *args, **kwargs):
        """
        Customized view endpoint to create a new motion.
        """
        # Check permission to send submitter and supporter data.
        if (not request.user.has_perm('motions.can_manage') and
                (request.data.getlist('submitters') or request.data.getlist('supporters'))):
            # Non-staff users are not allowed to send submitter or supporter data.
            self.permission_denied(request)

        # Validate data and create motion.
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        motion = serializer.save(request_user=request.user)

        # Write the log message and initiate response.
        motion.write_log([ugettext_noop('Motion created')], request.user)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        """
        Customized view endpoint to update a motion.

        Checks also whether the requesting user can update the motion. He
        needs at least the permissions 'motions.can_see' (see
        self.check_view_permissions()). Also the instance method
        get_allowed_actions() is evaluated.
        """
        # Get motion.
        motion = self.get_object()

        # Check permissions.
        if not motion.get_allowed_actions(request.user)['update']:
            self.permission_denied(request)

        # Check permission to send submitter and supporter data.
        if (not request.user.has_perm('motions.can_manage') and
                (request.data.get('submitters_id') or request.data.get('supporters_id'))):
            # Non-staff users are not allowed to send submitter or supporter data.
            self.permission_denied(request)

        # Validate data and update motion.
        serializer = self.get_serializer(
            motion,
            data=request.data,
            partial=kwargs.get('partial', False))
        serializer.is_valid(raise_exception=True)
        updated_motion = serializer.save()

        # Write the log message, check removal of supporters and initiate response.
        # TODO: Log if a version was updated.
        updated_motion.write_log([ugettext_noop('Motion updated')], request.user)
        if (config['motions_remove_supporters'] and updated_motion.state.allow_support and
                not request.user.has_perm('motions.can_manage')):
            updated_motion.supporters.clear()
            updated_motion.write_log([ugettext_noop('All supporters removed')], request.user)
        return Response(serializer.data)

    @detail_route(methods=['put', 'delete'])
    def manage_version(self, request, pk=None):
        """
        Special view endpoint to permit and delete a version of a motion.

        Send PUT {'version_number': <number>} to permit and DELETE
        {'version_number': <number>} to delete a version. Deleting the
        active version is not allowed. Only managers can use this view.
        """
        # Retrieve motion and version.
        motion = self.get_object()
        version_number = request.data.get('version_number')
        try:
            version = motion.versions.get(version_number=version_number)
        except MotionVersion.DoesNotExist:
            raise Http404('Version %s not found.' % version_number)

        # Permit or delete version.
        if request.method == 'PUT':
            # Permit version.
            motion.active_version = version
            motion.save(update_fields=['active_version'])
            motion.write_log(
                message_list=[ugettext_noop('Version'),
                              ' %d ' % version.version_number,
                              ugettext_noop('permitted')],
                person=self.request.user)
            message = _('Version %d permitted successfully.') % version.version_number
        else:
            # Delete version.
            # request.method == 'DELETE'
            if version == motion.active_version:
                raise ValidationError({'detail': _('You can not delete the active version of a motion.')})
            version.delete()
            motion.write_log(
                message_list=[ugettext_noop('Version'),
                              ' %d ' % version.version_number,
                              ugettext_noop('deleted')],
                person=self.request.user)
            message = _('Version %d deleted successfully.') % version.version_number

        # Initiate response.
        return Response({'detail': message})

    @detail_route(methods=['post', 'delete'])
    def support(self, request, pk=None):
        """
        Special view endpoint to support a motion or withdraw support
        (unsupport).

        Send POST to support and DELETE to unsupport.
        """
        # Retrieve motion and allowed actions.
        motion = self.get_object()
        allowed_actions = motion.get_allowed_actions(request.user)

        # Support or unsupport motion.
        if request.method == 'POST':
            # Support motion.
            if not allowed_actions['support']:
                raise ValidationError({'detail': _('You can not support this motion.')})
            motion.supporters.add(request.user)
            motion.write_log([ugettext_noop('Motion supported')], request.user)
            message = _('You have supported this motion successfully.')
        else:
            # Unsupport motion.
            # request.method == 'DELETE'
            if not allowed_actions['unsupport']:
                raise ValidationError({'detail': _('You can not unsupport this motion.')})
            motion.supporters.remove(request.user)
            motion.write_log([ugettext_noop('Motion unsupported')], request.user)
            message = _('You have unsupported this motion successfully.')

        # Initiate response.
        return Response({'detail': message})

    @detail_route(methods=['put'])
    def set_state(self, request, pk=None):
        """
        Special view endpoint to set and reset a state of a motion.

        Send PUT {'state': <state_id>} to set and just PUT {} to reset the
        state. Only managers can use this view.
        """
        # Retrieve motion and state.
        motion = self.get_object()
        state = request.data.get('state')

        # Set or reset state.
        if state is not None:
            # Check data and set state.
            try:
                state_id = int(state)
            except ValueError:
                raise ValidationError({'detail': _('Invalid data. State must be an integer.')})
            if state_id not in [item.id for item in motion.state.next_states.all()]:
                raise ValidationError(
                    {'detail': _('You can not set the state to %(state_id)d.') % {'state_id': state_id}})
            motion.set_state(state_id)
        else:
            # Reset state.
            motion.reset_state()

        # Save motion.
        motion.save(update_fields=['state', 'identifier'])
        message = _('The state of the motion was set to %s.') % motion.state.name

        # Write the log message and initiate response.
        motion.write_log(
            message_list=[ugettext_noop('State set to'), ' ', motion.state.name],
            person=request.user)
        return Response({'detail': message})

    @detail_route(methods=['post'])
    def create_poll(self, request, pk=None):
        """
        View to create a poll. It is a POST request without any data.
        """
        motion = self.get_object()
        try:
            with transaction.atomic():
                motion.create_poll()
        except WorkflowError as e:
            raise ValidationError({'detail': e})
        return Response({'detail': _('Poll created successfully.')})


class MotionPollViewSet(UpdateModelMixin, DestroyModelMixin, GenericViewSet):
    """
    API endpoint for motion polls.

    There are the following views: update and destroy.
    """
    queryset = MotionPoll.objects.all()
    serializer_class = MotionPollSerializer

    def check_view_permissions(self):
        """
        Returns True if the user has required permissions.
        """
        return (self.request.user.has_perm('motions.can_see') and
                self.request.user.has_perm('motions.can_manage'))


class CategoryViewSet(ModelViewSet):
    """
    API endpoint for categories.

    There are the following views: metadata, list, retrieve, create,
    partial_update, update and destroy.
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def check_view_permissions(self):
        """
        Returns True if the user has required permissions.
        """
        if self.action in ('metadata', 'list', 'retrieve'):
            result = self.request.user.has_perm('motions.can_see')
        elif self.action in ('create', 'partial_update', 'update', 'destroy'):
            result = (self.request.user.has_perm('motions.can_see') and
                      self.request.user.has_perm('motions.can_manage'))
        else:
            result = False
        return result


class WorkflowViewSet(ModelViewSet):
    """
    API endpoint for workflows.

    There are the following views: metadata, list, retrieve, create,
    partial_update, update and destroy.
    """
    queryset = Workflow.objects.all()
    serializer_class = WorkflowSerializer

    def check_view_permissions(self):
        """
        Returns True if the user has required permissions.
        """
        if self.action in ('metadata', 'list', 'retrieve'):
            result = self.request.user.has_perm('motions.can_see')
        elif self.action in ('create', 'partial_update', 'update', 'destroy'):
            result = (self.request.user.has_perm('motions.can_see') and
                      self.request.user.has_perm('motions.can_manage'))
        else:
            result = False
        return result


# Views to generate PDFs

class PollPDFView(PDFView):
    """
    Generates a ballotpaper.
    """

    required_permission = 'motions.can_manage'
    top_space = 0

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
