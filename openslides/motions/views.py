import base64
import re

from django.conf import settings
from django.contrib.staticfiles import finders
from django.db import IntegrityError, transaction
from django.http import Http404
from django.utils.translation import ugettext as _
from django.utils.translation import ugettext_noop
from rest_framework import status

from ..core.config import config
from ..utils.auth import has_perm
from ..utils.autoupdate import inform_changed_data
from ..utils.collection import CollectionElement
from ..utils.rest_api import (
    DestroyModelMixin,
    GenericViewSet,
    ModelViewSet,
    Response,
    UpdateModelMixin,
    ValidationError,
    detail_route,
)
from ..utils.views import APIView
from .access_permissions import (
    CategoryAccessPermissions,
    MotionAccessPermissions,
    MotionBlockAccessPermissions,
    MotionChangeRecommendationAccessPermissions,
    WorkflowAccessPermissions,
)
from .exceptions import WorkflowError
from .models import (
    Category,
    Motion,
    MotionBlock,
    MotionChangeRecommendation,
    MotionPoll,
    MotionVersion,
    State,
    Workflow,
)
from .serializers import MotionPollSerializer


# Viewsets for the REST API

class MotionViewSet(ModelViewSet):
    """
    API endpoint for motions.

    There are the following views: metadata, list, retrieve, create,
    partial_update, update, destroy, manage_version, support, set_state and
    create_poll.
    """
    access_permissions = MotionAccessPermissions()
    queryset = Motion.objects.all()

    def check_view_permissions(self):
        """
        Returns True if the user has required permissions.
        """
        if self.action in ('list', 'retrieve'):
            result = self.get_access_permissions().check_permissions(self.request.user)
        elif self.action in ('metadata', 'partial_update', 'update'):
            result = has_perm(self.request.user, 'motions.can_see')
            # For partial_update and update requests the rest of the check is
            # done in the update method. See below.
        elif self.action == 'create':
            result = (has_perm(self.request.user, 'motions.can_see') and
                      has_perm(self.request.user, 'motions.can_create') and
                      (not config['motions_stop_submitting'] or
                       has_perm(self.request.user, 'motions.can_manage')))
        elif self.action in ('destroy', 'manage_version', 'set_state', 'set_recommendation', 'create_poll'):
            result = (has_perm(self.request.user, 'motions.can_see') and
                      has_perm(self.request.user, 'motions.can_manage'))
        elif self.action == 'support':
            result = (has_perm(self.request.user, 'motions.can_see') and
                      has_perm(self.request.user, 'motions.can_support'))
        else:
            result = False
        return result

    def create(self, request, *args, **kwargs):
        """
        Customized view endpoint to create a new motion.
        """
        # Check if parent motion exists.
        if request.data.get('parent_id') is not None:
            try:
                parent_motion = CollectionElement.from_values(
                    Motion.get_collection_string(),
                    request.data['parent_id'])
            except Motion.DoesNotExist:
                raise ValidationError({'detail': _('The parent motion does not exist.')})
        else:
            parent_motion = None

        # Check permission to send some data.
        if not has_perm(request.user, 'motions.can_manage'):
            whitelist = [
                'title',
                'text',
                'reason',
                'comments',  # This is checked later.
            ]
            if parent_motion is not None:
                # For creating amendments.
                whitelist.extend([
                    'parent_id',
                    'category_id',      # This will be set to the matching
                    'motion_block_id',  # values from parent_motion.
                ])
                request.data['category_id'] = parent_motion.get_full_data().get('category_id')
                request.data['motion_block_id'] = parent_motion.get_full_data().get('motion_block_id')
            for key in request.data.keys():
                if key not in whitelist:
                    # Non-staff users are allowed to send only some data.
                    self.permission_denied(request)

        # Check permission to send comment data.
        if not has_perm(request.user, 'motions.can_see_and_manage_comments'):
            try:
                # Ignore comments data if user is not allowed to send comments.
                del request.data['comments']
            except KeyError:
                # No comments here. Just do nothing.
                pass

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
        self.check_view_permissions()). Also check manage permission or
        submitter and state.
        """
        # Get motion.
        motion = self.get_object()

        # Check permissions.
        if (not has_perm(request.user, 'motions.can_manage') and
            not (motion.is_submitter(request.user) and
                 motion.state.allow_submitter_edit)):
            self.permission_denied(request)

        # Check permission to send only some data.
        if not has_perm(request.user, 'motions.can_manage'):
            # Remove fields that the user is not allowed to change.
            # The list() is required because we want to use del inside the loop.
            keys = list(request.data.keys())
            whitelist = (
                'title',
                'text',
                'reason',
                'comments',  # This is checked later.
            )
            for key in keys:
                if key not in whitelist:
                    del request.data[key]
        if not has_perm(request.user, 'motions.can_see_and_manage_comments'):
            try:
                del request.data['comments']
            except KeyError:
                # No comments here. Just do nothing.
                pass

        # Validate data and update motion.
        serializer = self.get_serializer(
            motion,
            data=request.data,
            partial=kwargs.get('partial', False))
        serializer.is_valid(raise_exception=True)
        updated_motion = serializer.save(disable_versioning=request.data.get('disable_versioning'))

        # Write the log message, check removal of supporters and initiate response.
        # TODO: Log if a version was updated.
        updated_motion.write_log([ugettext_noop('Motion updated')], request.user)
        if (config['motions_remove_supporters'] and updated_motion.state.allow_support and
                not has_perm(request.user, 'motions.can_manage')):
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

        # Support or unsupport motion.
        if request.method == 'POST':
            # Support motion.
            if not (motion.state.allow_support and
                    config['motions_min_supporters'] > 0 and
                    not motion.is_submitter(request.user) and
                    not motion.is_supporter(request.user)):
                raise ValidationError({'detail': _('You can not support this motion.')})
            motion.supporters.add(request.user)
            motion.write_log([ugettext_noop('Motion supported')], request.user)
            message = _('You have supported this motion successfully.')
        else:
            # Unsupport motion.
            # request.method == 'DELETE'
            if not motion.state.allow_support or not motion.is_supporter(request.user):
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
        motion.save(update_fields=['state', 'identifier', 'identifier_number'])
        message = _('The state of the motion was set to %s.') % motion.state.name

        # Write the log message and initiate response.
        motion.write_log(
            message_list=[ugettext_noop('State set to'), ' ', motion.state.name],
            person=request.user)
        return Response({'detail': message})

    @detail_route(methods=['put'])
    def set_recommendation(self, request, pk=None):
        """
        Special view endpoint to set a recommendation of a motion.

        Send PUT {'recommendation': <state_id>} to set and just PUT {} to
        reset the recommendation. Only managers can use this view.
        """
        # Retrieve motion and recommendation state.
        motion = self.get_object()
        recommendation_state = request.data.get('recommendation')

        # Set or reset recommendation.
        if recommendation_state is not None:
            # Check data and set recommendation.
            try:
                recommendation_state_id = int(recommendation_state)
            except ValueError:
                raise ValidationError({'detail': _('Invalid data. Recommendation must be an integer.')})
            recommendable_states = State.objects.filter(workflow=motion.workflow, recommendation_label__isnull=False)
            if recommendation_state_id not in [item.id for item in recommendable_states]:
                raise ValidationError(
                    {'detail': _('You can not set the recommendation to {recommendation_state_id}.').format(
                        recommendation_state_id=recommendation_state_id)})
            motion.set_recommendation(recommendation_state_id)
        else:
            # Reset recommendation.
            motion.recommendation = None

        # Save motion.
        motion.save(update_fields=['recommendation'])
        label = motion.recommendation.recommendation_label if motion.recommendation else 'None'
        message = _('The recommendation of the motion was set to %s.') % label

        # Write the log message and initiate response.
        motion.write_log(
            message_list=[ugettext_noop('Recommendation set to'), ' ', label],
            person=request.user)
        return Response({'detail': message})

    @detail_route(methods=['post'])
    def create_poll(self, request, pk=None):
        """
        View to create a poll. It is a POST request without any data.
        """
        motion = self.get_object()
        if not motion.state.allow_create_poll:
            raise ValidationError({'detail': 'You can not create a poll in this motion state.'})
        try:
            with transaction.atomic():
                motion.create_poll()
        except WorkflowError as e:
            raise ValidationError({'detail': e})
        motion.write_log([ugettext_noop('Vote created')], request.user)
        return Response({'detail': _('Vote created successfully.')})


class MotionPollViewSet(UpdateModelMixin, DestroyModelMixin, GenericViewSet):
    """
    API endpoint for motion polls.

    There are the following views: update, partial_update and destroy.
    """
    queryset = MotionPoll.objects.all()
    serializer_class = MotionPollSerializer

    def check_view_permissions(self):
        """
        Returns True if the user has required permissions.
        """
        return (has_perm(self.request.user, 'motions.can_see') and
                has_perm(self.request.user, 'motions.can_manage'))

    def update(self, *args, **kwargs):
        """
        Customized view endpoint to update a motion poll.
        """
        result = super().update(*args, **kwargs)
        poll = self.get_object()
        poll.motion.write_log([ugettext_noop('Vote updated')], self.request.user)
        return result

    def destroy(self, *args, **kwargs):
        """
        Customized view endpoint to delete a motion poll.
        """
        result = super().destroy(*args, **kwargs)
        poll = self.get_object()
        poll.motion.write_log([ugettext_noop('Vote deleted')], self.request.user)
        return result


class MotionChangeRecommendationViewSet(ModelViewSet):
    """
    API endpoint for motion change recommendations.

    There are the following views: metadata, list, retrieve, create,
    partial_update, update and destroy.
    """
    access_permissions = MotionChangeRecommendationAccessPermissions()
    queryset = MotionChangeRecommendation.objects.all()

    def check_view_permissions(self):
        """
        Returns True if the user has required permissions.
        """
        if self.action in ('list', 'retrieve'):
            result = self.get_access_permissions().check_permissions(self.request.user)
        elif self.action == 'metadata':
            result = has_perm(self.request.user, 'motions.can_see')
        elif self.action in ('create', 'destroy', 'partial_update', 'update'):
            result = (has_perm(self.request.user, 'motions.can_see') and
                      has_perm(self.request.user, 'motions.can_manage'))
        else:
            result = False
        return result


class CategoryViewSet(ModelViewSet):
    """
    API endpoint for categories.

    There are the following views: metadata, list, retrieve, create,
    partial_update, update, destroy and numbering.
    """
    access_permissions = CategoryAccessPermissions()
    queryset = Category.objects.all()

    def check_view_permissions(self):
        """
        Returns True if the user has required permissions.
        """
        if self.action in ('list', 'retrieve'):
            result = self.get_access_permissions().check_permissions(self.request.user)
        elif self.action == 'metadata':
            result = has_perm(self.request.user, 'motions.can_see')
        elif self.action in ('create', 'partial_update', 'update', 'destroy', 'numbering'):
            result = (has_perm(self.request.user, 'motions.can_see') and
                      has_perm(self.request.user, 'motions.can_manage'))
        else:
            result = False
        return result

    @detail_route(methods=['post'])
    def numbering(self, request, pk=None):
        """
        Special view endpoint to number all motions in this category.

        Only managers can use this view.

        Send POST {'motions': [<list of motion ids>]} to sort the given
        motions in a special order. Ids of motions which do not belong to
        the category are just ignored. Send just POST {} to sort all
        motions in the category by database id.

        Amendments will get a new identifier prefix if the old prefix matches
        the old parent motion identifier.
        """
        category = self.get_object()
        number = 0
        instances = []

        # If MOTION_IDENTIFIER_WITHOUT_BLANKS is set, don't use blanks when building identifier.
        without_blank = hasattr(settings, 'MOTION_IDENTIFIER_WITHOUT_BLANKS') and settings.MOTION_IDENTIFIER_WITHOUT_BLANKS

        # Prepare ordered list of motions.
        if not category.prefix:
            prefix = ''
        elif without_blank:
            prefix = '%s' % category.prefix
        else:
            prefix = '%s ' % category.prefix
        motions = category.motion_set.all()
        motion_list = request.data.get('motions')
        if motion_list:
            motion_dict = {}
            for motion in motions.filter(id__in=motion_list):
                motion_dict[motion.pk] = motion
            motions = [motion_dict[pk] for pk in motion_list]

        # Change identifiers.
        try:
            with transaction.atomic():
                # Collect old and new identifiers.
                motions_to_be_sorted = []
                for motion in motions:
                    if motion.is_amendment():
                        parent_identifier = motion.parent.identifier or ''
                        if without_blank:
                            prefix = '%s%s' % (parent_identifier, config['motions_amendments_prefix'])
                        else:
                            prefix = '%s %s ' % (parent_identifier, config['motions_amendments_prefix'])
                    number += 1
                    new_identifier = '%s%s' % (prefix, motion.extend_identifier_number(number))
                    motions_to_be_sorted.append({
                        'motion': motion,
                        'old_identifier': motion.identifier,
                        'new_identifier': new_identifier,
                        'number': number
                    })

                # Remove old identifiers
                for motion in motions:
                    motion.identifier = None
                    motion.skip_autoupdate = True  # This line is to skip agenda item autoupdate. See agenda/signals.py.
                    motion.save(skip_autoupdate=True)

                # Set new identifers and change identifiers of amendments.
                for obj in motions_to_be_sorted:
                    motion = obj['motion']
                    motion.identifier = obj['new_identifier']
                    motion.identifier_number = obj['number']
                    motion.save(skip_autoupdate=True)
                    instances.append(motion)
                    instances.append(motion.agenda_item)
                    # Change identifiers of amendments.
                    for child in motion.get_amendments_deep():
                        if child.identifier.startswith(obj['old_identifier']):
                            child.identifier = re.sub(
                                obj['old_identifier'],
                                obj['new_identifier'],
                                child.identifier,
                                count=1)
                            child.skip_autoupdate = True  # This line is to skip agenda item autoupdate. See agenda/signals.py.
                            child.save(skip_autoupdate=True)
                            instances.append(child)
                            instances.append(child.agenda_item)
        except IntegrityError:
            message = _('Error: At least one identifier of this category does '
                        'already exist in another category.')
            response = Response({'detail': message}, status=400)
        else:
            inform_changed_data(instances)
            message = _('All motions in category {category} numbered '
                        'successfully.').format(category=category)
            response = Response({'detail': message})
        return response


class MotionBlockViewSet(ModelViewSet):
    """
    API endpoint for motion blocks.

    There are the following views: metadata, list, retrieve, create,
    partial_update, update and destroy.
    """
    access_permissions = MotionBlockAccessPermissions()
    queryset = MotionBlock.objects.all()

    def check_view_permissions(self):
        """
        Returns True if the user has required permissions.
        """
        if self.action in ('list', 'retrieve'):
            result = self.get_access_permissions().check_permissions(self.request.user)
        elif self.action == 'metadata':
            result = has_perm(self.request.user, 'motions.can_see')
        elif self.action in ('create', 'partial_update', 'update', 'destroy', 'follow_recommendations'):
            result = (has_perm(self.request.user, 'motions.can_see') and
                      has_perm(self.request.user, 'motions.can_manage'))
        else:
            result = False
        return result

    @detail_route(methods=['post'])
    def follow_recommendations(self, request, pk=None):
        """
        View to set the states of all motions of this motion block each to
        its recommendation. It is a POST request without any data.
        """
        motion_block = self.get_object()
        instances = []
        with transaction.atomic():
            for motion in motion_block.motion_set.all():
                # Follow recommendation.
                motion.follow_recommendation()
                motion.save(skip_autoupdate=True)
                # Write the log message.
                motion.write_log(
                    message_list=[ugettext_noop('State set to'), ' ', motion.state.name],
                    person=request.user,
                    skip_autoupdate=True)
                instances.append(motion)
        inform_changed_data(instances)
        return Response({'detail': _('Followed recommendations successfully.')})


class WorkflowViewSet(ModelViewSet):
    """
    API endpoint for workflows.

    There are the following views: metadata, list, retrieve, create,
    partial_update, update and destroy.
    """
    access_permissions = WorkflowAccessPermissions()
    queryset = Workflow.objects.all()

    def check_view_permissions(self):
        """
        Returns True if the user has required permissions.
        """
        if self.action in ('list', 'retrieve'):
            result = self.get_access_permissions().check_permissions(self.request.user)
        elif self.action == 'metadata':
            result = has_perm(self.request.user, 'motions.can_see')
        elif self.action in ('create', 'partial_update', 'update', 'destroy'):
            result = (has_perm(self.request.user, 'motions.can_see') and
                      has_perm(self.request.user, 'motions.can_manage'))
        else:
            result = False
        return result


# Special API views

class MotionDocxTemplateView(APIView):
    """
    Returns the template for motions docx export
    """
    http_method_names = ['get']

    def get_context_data(self, **context):
        with open(finders.find('templates/docx/motions.docx'), "rb") as file:
            response = base64.b64encode(file.read())
        return response
