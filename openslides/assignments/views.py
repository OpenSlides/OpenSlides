from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils.translation import ugettext as _

from openslides.utils.autoupdate import inform_changed_data
from openslides.utils.rest_api import (
    DestroyModelMixin,
    GenericViewSet,
    ModelViewSet,
    Response,
    UpdateModelMixin,
    ValidationError,
    detail_route,
)

from ..utils.auth import has_perm
from .access_permissions import AssignmentAccessPermissions
from .models import Assignment, AssignmentPoll, AssignmentRelatedUser
from .serializers import AssignmentAllPollSerializer


# Viewsets for the REST API

class AssignmentViewSet(ModelViewSet):
    """
    API endpoint for assignments.

    There are the following views: metadata, list, retrieve, create,
    partial_update, update, destroy, candidature_self, candidature_other,
    mark_elected and create_poll.
    """
    access_permissions = AssignmentAccessPermissions()
    queryset = Assignment.objects.all()

    def check_view_permissions(self):
        """
        Returns True if the user has required permissions.
        """
        if self.action in ('list', 'retrieve'):
            result = self.get_access_permissions().check_permissions(self.request.user)
        elif self.action == 'metadata':
            # Everybody is allowed to see the metadata.
            result = True
        elif self.action in ('create', 'partial_update', 'update', 'destroy',
                             'mark_elected', 'create_poll', 'sort_related_users'):
            result = (has_perm(self.request.user, 'assignments.can_see') and
                      has_perm(self.request.user, 'assignments.can_manage'))
        elif self.action == 'candidature_self':
            result = (has_perm(self.request.user, 'assignments.can_see') and
                      has_perm(self.request.user, 'assignments.can_nominate_self'))
        elif self.action == 'candidature_other':
            result = (has_perm(self.request.user, 'assignments.can_see') and
                      has_perm(self.request.user, 'assignments.can_nominate_other'))
        else:
            result = False
        return result

    @detail_route(methods=['post', 'delete'])
    def candidature_self(self, request, pk=None):
        """
        View to nominate self as candidate (POST) or withdraw own
        candidature (DELETE).
        """
        assignment = self.get_object()
        if assignment.is_elected(request.user):
            raise ValidationError({'detail': _('You are already elected.')})
        if request.method == 'POST':
            message = self.nominate_self(request, assignment)
        else:
            # request.method == 'DELETE'
            message = self.withdraw_self(request, assignment)
        return Response({'detail': message})

    def nominate_self(self, request, assignment):
        if assignment.phase == assignment.PHASE_FINISHED:
            raise ValidationError({'detail': _('You can not candidate to this election because it is finished.')})
        if assignment.phase == assignment.PHASE_VOTING and not has_perm(request.user, 'assignments.can_manage'):
            # To nominate self during voting you have to be a manager.
            self.permission_denied(request)
        # If the request.user is already a candidate he can nominate himself nevertheless.
        assignment.set_candidate(request.user)
        return _('You were nominated successfully.')

    def withdraw_self(self, request, assignment):
        # Withdraw candidature.
        if assignment.phase == assignment.PHASE_FINISHED:
            raise ValidationError({'detail': _('You can not withdraw your candidature to this election because it is finished.')})
        if assignment.phase == assignment.PHASE_VOTING and not has_perm(request.user, 'assignments.can_manage'):
            # To withdraw self during voting you have to be a manager.
            self.permission_denied(request)
        if not assignment.is_candidate(request.user):
            raise ValidationError({'detail': _('You are not a candidate of this election.')})
        assignment.delete_related_user(request.user)
        return _('You have withdrawn your candidature successfully.')

    def get_user_from_request_data(self, request):
        """
        Helper method to get a specific user from request data (not the
        request.user) so that the views self.candidature_other or
        self.mark_elected can play with it.
        """
        if not isinstance(request.data, dict):
            detail = _('Invalid data. Expected dictionary, got %s.') % type(request.data)
            raise ValidationError({'detail': detail})
        user_str = request.data.get('user', '')
        try:
            user_pk = int(user_str)
        except ValueError:
            raise ValidationError({'detail': _('Invalid data. Expected something like {"user": <id>}.')})
        try:
            user = get_user_model().objects.get(pk=user_pk)
        except get_user_model().DoesNotExist:
            raise ValidationError({'detail': _('Invalid data. User %d does not exist.') % user_pk})
        return user

    @detail_route(methods=['post', 'delete'])
    def candidature_other(self, request, pk=None):
        """
        View to nominate other users (POST) or delete their candidature
        status (DELETE). The client has to send {'user': <id>}.
        """
        user = self.get_user_from_request_data(request)
        assignment = self.get_object()
        if request.method == 'POST':
            message = self.nominate_other(request, user, assignment)
        else:
            # request.method == 'DELETE'
            message = self.delete_other(request, user, assignment)
        return Response({'detail': message})

    def nominate_other(self, request, user, assignment):
        if assignment.is_elected(user):
            raise ValidationError({'detail': _('User %s is already elected.') % user})
        if assignment.phase == assignment.PHASE_FINISHED:
            detail = _('You can not nominate someone to this election because it is finished.')
            raise ValidationError({'detail': detail})
        if assignment.phase == assignment.PHASE_VOTING and not has_perm(request.user, 'assignments.can_manage'):
            # To nominate another user during voting you have to be a manager.
            self.permission_denied(request)
        if assignment.is_candidate(user):
            raise ValidationError({'detail': _('User %s is already nominated.') % user})
        assignment.set_candidate(user)
        return _('User %s was nominated successfully.') % user

    def delete_other(self, request, user, assignment):
        # To delete candidature status you have to be a manager.
        if not has_perm(request.user, 'assignments.can_manage'):
            self.permission_denied(request)
        if assignment.phase == assignment.PHASE_FINISHED:
            detail = _("You can not delete someone's candidature to this election because it is finished.")
            raise ValidationError({'detail': detail})
        if not assignment.is_candidate(user) and not assignment.is_elected(user):
            raise ValidationError({'detail': _('User %s has no status in this election.') % user})
        assignment.delete_related_user(user)
        return _('Candidate %s was withdrawn successfully.') % user

    @detail_route(methods=['post', 'delete'])
    def mark_elected(self, request, pk=None):
        """
        View to mark other users as elected (POST) or undo this (DELETE).
        The client has to send {'user': <id>}.
        """
        user = self.get_user_from_request_data(request)
        assignment = self.get_object()
        if request.method == 'POST':
            if not assignment.is_candidate(user):
                raise ValidationError({'detail': _('User %s is not a candidate of this election.') % user})
            assignment.set_elected(user)
            message = _('User %s was successfully elected.') % user
        else:
            # request.method == 'DELETE'
            if not assignment.is_elected(user):
                detail = _('User %s is not an elected candidate of this election.') % user
                raise ValidationError({'detail': detail})
            assignment.set_candidate(user)
            message = _('User %s was successfully unelected.') % user
        return Response({'detail': message})

    @detail_route(methods=['post'])
    def create_poll(self, request, pk=None):
        """
        View to create a poll. It is a POST request without any data.
        """
        assignment = self.get_object()
        if not assignment.candidates.exists():
            raise ValidationError({'detail': _('Can not create ballot because there are no candidates.')})
        with transaction.atomic():
            assignment.create_poll()
        return Response({'detail': _('Ballot created successfully.')})

    @detail_route(methods=['post'])
    def sort_related_users(self, request, pk=None):
        """
        Special view endpoint to sort the assignment related users.

        Expects a list of IDs of the related users (pk of AssignmentRelatedUser model).
        """
        assignment = self.get_object()

        # Check data
        related_user_ids = request.data.get('related_users')
        if not isinstance(related_user_ids, list):
            raise ValidationError(
                {'detail': _('users has to be a list of IDs.')})

        # Get all related users from AssignmentRelatedUser.
        related_users = {}
        for related_user in AssignmentRelatedUser.objects.filter(assignment__id=assignment.id):
            related_users[related_user.pk] = related_user

        # Check all given candidates from the request
        valid_related_users = []
        for related_user_id in related_user_ids:
            if not isinstance(related_user_id, int) or related_users.get(related_user_id) is None:
                raise ValidationError(
                    {'detail': _('Invalid data.')})
            valid_related_users.append(related_users[related_user_id])

        # Sort the related users
        weight = 1
        with transaction.atomic():
            for valid_related_user in valid_related_users:
                valid_related_user.weight = weight
                valid_related_user.save(skip_autoupdate=True)
                weight += 1

        # send autoupdate
        inform_changed_data(assignment)

        # Initiate response.
        return Response({'detail': _('Assignment related users successfully sorted.')})


class AssignmentPollViewSet(UpdateModelMixin, DestroyModelMixin, GenericViewSet):
    """
    API endpoint for assignment polls.

    There are the following views: update, partial_update and destroy.
    """
    queryset = AssignmentPoll.objects.all()
    serializer_class = AssignmentAllPollSerializer

    def check_view_permissions(self):
        """
        Returns True if the user has required permissions.
        """
        return (has_perm(self.request.user, 'assignments.can_see') and
                has_perm(self.request.user, 'assignments.can_manage'))
