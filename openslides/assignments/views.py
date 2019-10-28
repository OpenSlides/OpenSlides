from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db import transaction

from openslides.poll.views import BasePollViewSet, BaseVoteViewSet
from openslides.utils.auth import has_perm
from openslides.utils.autoupdate import inform_changed_data
from openslides.utils.rest_api import (
    ModelViewSet,
    Response,
    ValidationError,
    detail_route,
)
from openslides.utils.utils import is_int

from .access_permissions import AssignmentAccessPermissions
from .models import Assignment, AssignmentPoll, AssignmentRelatedUser, AssignmentVote


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
        if self.action in ("list", "retrieve"):
            result = self.get_access_permissions().check_permissions(self.request.user)
        elif self.action == "metadata":
            # Everybody is allowed to see the metadata.
            result = True
        elif self.action in (
            "create",
            "partial_update",
            "update",
            "destroy",
            "mark_elected",
            "sort_related_users",
        ):
            result = has_perm(self.request.user, "assignments.can_see") and has_perm(
                self.request.user, "assignments.can_manage"
            )
        elif self.action == "candidature_self":
            result = has_perm(self.request.user, "assignments.can_see") and has_perm(
                self.request.user, "assignments.can_nominate_self"
            )
        elif self.action == "candidature_other":
            result = has_perm(self.request.user, "assignments.can_see") and has_perm(
                self.request.user, "assignments.can_nominate_other"
            )
        else:
            result = False
        return result

    def perform_create(self, serializer):
        serializer.save(request_user=self.request.user)

    @detail_route(methods=["post", "delete"])
    def candidature_self(self, request, pk=None):
        """
        View to nominate self as candidate (POST) or withdraw own
        candidature (DELETE).
        """
        assignment = self.get_object()
        if assignment.is_elected(request.user):
            raise ValidationError({"detail": "You are already elected."})
        if request.method == "POST":
            message = self.nominate_self(request, assignment)
        else:
            # request.method == 'DELETE'
            message = self.withdraw_self(request, assignment)
        return Response({"detail": message})

    def nominate_self(self, request, assignment):
        if assignment.phase == assignment.PHASE_FINISHED:
            raise ValidationError(
                {
                    "detail": "You can not candidate to this election because it is finished."
                }
            )
        if assignment.phase == assignment.PHASE_VOTING and not has_perm(
            request.user, "assignments.can_manage"
        ):
            # To nominate self during voting you have to be a manager.
            self.permission_denied(request)
        # If the request.user is already a candidate he can nominate himself nevertheless.
        assignment.add_candidate(request.user)
        # Send new candidate via autoupdate because users without permission
        # to see users may not have it but can get it now.
        inform_changed_data([request.user])
        return "You were nominated successfully."

    def withdraw_self(self, request, assignment):
        # Withdraw candidature.
        if assignment.phase == assignment.PHASE_FINISHED:
            raise ValidationError(
                {
                    "detail": "You can not withdraw your candidature to this election because it is finished."
                }
            )
        if assignment.phase == assignment.PHASE_VOTING and not has_perm(
            request.user, "assignments.can_manage"
        ):
            # To withdraw self during voting you have to be a manager.
            self.permission_denied(request)
        if not assignment.is_candidate(request.user):
            raise ValidationError(
                {"detail": "You are not a candidate of this election."}
            )
        assignment.remove_candidate(request.user)
        return "You have withdrawn your candidature successfully."

    def get_user_from_request_data(self, request):
        """
        Helper method to get a specific user from request data (not the
        request.user) so that the views self.candidature_other or
        self.mark_elected can play with it.
        """
        if not isinstance(request.data, dict):
            raise ValidationError(
                {
                    "detail": "Invalid data. Expected dictionary, got {0}.",
                    "args": [type(request.data)],
                }
            )
        user_str = request.data.get("user", "")
        try:
            user_pk = int(user_str)
        except ValueError:
            raise ValidationError(
                {"detail": 'Invalid data. Expected something like {"user": <id>}.'}
            )
        try:
            user = get_user_model().objects.get(pk=user_pk)
        except get_user_model().DoesNotExist:
            raise ValidationError(
                {"detail": "Invalid data. User {0} does not exist.", "args": [user_pk]}
            )
        return user

    @detail_route(methods=["post", "delete"])
    def candidature_other(self, request, pk=None):
        """
        View to nominate other users (POST) or delete their candidature
        status (DELETE). The client has to send {'user': <id>}.
        """
        user = self.get_user_from_request_data(request)
        assignment = self.get_object()
        if request.method == "POST":
            return self.nominate_other(request, user, assignment)
        else:
            # request.method == 'DELETE'
            return self.delete_other(request, user, assignment)

    def nominate_other(self, request, user, assignment):
        if assignment.is_elected(user):
            raise ValidationError(
                {"detail": "User {0} is already elected.", "args": [str(user)]}
            )
        if assignment.phase == assignment.PHASE_FINISHED:
            raise ValidationError(
                {
                    "detail": "You can not nominate someone to this election because it is finished."
                }
            )
        if assignment.phase == assignment.PHASE_VOTING and not has_perm(
            request.user, "assignments.can_manage"
        ):
            # To nominate another user during voting you have to be a manager.
            self.permission_denied(request)
        if assignment.is_candidate(user):
            raise ValidationError(
                {"detail": "User {0} is already nominated.", "args": [str(user)]}
            )
        assignment.add_candidate(user)
        # Send new candidate via autoupdate because users without permission
        # to see users may not have it but can get it now.
        inform_changed_data(user)
        return Response(
            {"detail": "User {0} was nominated successfully.", "args": [str(user)]}
        )

    def delete_other(self, request, user, assignment):
        # To delete candidature status you have to be a manager.
        if not has_perm(request.user, "assignments.can_manage"):
            self.permission_denied(request)
        if assignment.phase == assignment.PHASE_FINISHED:
            raise ValidationError(
                {
                    "detail": "You can not delete someone's candidature to this election because it is finished."
                }
            )
        if not assignment.is_candidate(user) and not assignment.is_elected(user):
            raise ValidationError(
                {
                    "detail": "User {0} has no status in this election.",
                    "args": [str(user)],
                }
            )
        assignment.remove_candidate(user)
        return Response(
            {"detail": "Candidate {0} was withdrawn successfully.", "args": [str(user)]}
        )

    @detail_route(methods=["post", "delete"])
    def mark_elected(self, request, pk=None):
        """
        View to mark other users as elected (POST) or undo this (DELETE).
        The client has to send {'user': <id>}.
        """
        user = self.get_user_from_request_data(request)
        assignment = self.get_object()
        if request.method == "POST":
            if not assignment.is_candidate(user):
                raise ValidationError(
                    {
                        "detail": "User {0} is not a candidate of this election.",
                        "args": [str(user)],
                    }
                )
            assignment.set_elected(user)
            message = "User {0} was successfully elected."
        else:
            # request.method == 'DELETE'
            if not assignment.is_elected(user):
                raise ValidationError(
                    {
                        "detail": "User {0} is not an elected candidate of this election.",
                        "args": [str(user)],
                    }
                )
            assignment.add_candidate(user)
            message = "User {0} was successfully unelected."
        return Response({"detail": message, "args": [str(user)]})

    @detail_route(methods=["post"])
    def create_poll(self, request, pk=None):
        """
        View to create a poll. It is a POST request without any data.
        """
        assignment = self.get_object()
        if not assignment.candidates.exists():
            raise ValidationError(
                {"detail": "Can not create ballot because there are no candidates."}
            )
        with transaction.atomic():
            poll = assignment.create_poll()
        return Response(
            {"detail": "Ballot created successfully.", "createdPollId": poll.pk}
        )

    @detail_route(methods=["post"])
    def sort_related_users(self, request, pk=None):
        """
        Special view endpoint to sort the assignment related users.

        Expects a list of IDs of the related users (pk of AssignmentRelatedUser model).
        """
        assignment = self.get_object()

        # Check data
        related_user_ids = request.data.get("related_users")
        if not isinstance(related_user_ids, list):
            raise ValidationError({"detail": "users has to be a list of IDs."})

        # Get all related users from AssignmentRelatedUser.
        related_users = {}
        for related_user in AssignmentRelatedUser.objects.filter(
            assignment__id=assignment.id
        ):
            related_users[related_user.pk] = related_user

        # Check all given candidates from the request
        valid_related_users = []
        for related_user_id in related_user_ids:
            if (
                not isinstance(related_user_id, int)
                or related_users.get(related_user_id) is None
            ):
                raise ValidationError({"detail": "Invalid data."})
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
        return Response({"detail": "Assignment related users successfully sorted."})


class AssignmentPollViewSet(BasePollViewSet):
    """
    API endpoint for assignment polls.

    There are the following views: update, partial_update and destroy.
    """

    queryset = AssignmentPoll.objects.all()

    def has_manage_permissions(self):
        """
        Returns True if the user has required permissions.
        """
        return has_perm(self.request.user, "assignments.can_see") and has_perm(
            self.request.user, "assignments.can_manage"
        )

    def perform_create(self, serializer):
        assignment = serializer.validated_data["assignment"]
        if not assignment.candidates.exists():
            raise ValidationError(
                {"detail": "Can not create poll because there are no candidates."}
            )

        super().perform_create(serializer)

    def handle_analog_vote(self, data, poll, user):
        """
        Request data:
        {
            "options": {<option_id>: {"Y": <amount>, ["N": <amount>], ["A": <amount>] }},
            ["votesvalid": <amount>], ["votesinvalid": <amount>], ["votescast": <amount>],
            ["global_no": <amount>], ["global_abstain": <amount>]
        }
        All amounts are decimals as strings

        required fields per pollmethod:
        - votes: Y
        - YN: YN
        - YNA: YNA
        """
        if not isinstance(data, dict):
            raise ValidationError({"detail": "Data must be a dict"})

        options_data = data.get("options")
        if not isinstance(options_data, dict):
            raise ValidationError({"detail": "You must provide options"})

        for key, value in options_data.items():
            if not is_int(key):
                raise ValidationError({"detail": "Keys must be int"})
            if not isinstance(value, dict):
                raise ValidationError({"detail": "A dict per option is required"})
            self.parse_decimal_value(value.get("Y"), min_value=-2)
            if poll.pollmethod in (
                AssignmentPoll.POLLMETHOD_YN,
                AssignmentPoll.POLLMETHOD_YNA,
            ):
                self.parse_decimal_value(value.get("N"), min_value=-2)
            if poll.pollmethod == AssignmentPoll.POLLMETHOD_YNA:
                self.parse_decimal_value(value.get("A"), min_value=-2)

        # Check and set votes* values here, because this might raise errors.
        if "votesvalid" in data:
            poll.votesvalid = self.parse_decimal_value(data["votesvalid"], min_value=-2)
        if "votesinvalid" in data:
            poll.votesinvalid = self.parse_decimal_value(
                data["votesinvalid"], min_value=-2
            )
        if "votescast" in data:
            poll.votescast = self.parse_decimal_value(data["votescast"], min_value=-2)

        global_no_enabled = (
            poll.global_no and poll.pollmethod == AssignmentPoll.POLLMETHOD_VOTES
        )
        global_abstain_enabled = (
            poll.global_abstain and poll.pollmethod == AssignmentPoll.POLLMETHOD_VOTES
        )
        if "global_no" in data and global_no_enabled:
            self.parse_decimal_value(data["votescast"], min_value=-2)
        if "global_abstain" in data and global_abstain_enabled:
            self.parse_decimal_value(data["votescast"], min_value=-2)

        options = poll.get_options()

        # Check, if all options were given
        db_option_ids = set(option.id for option in options)
        data_option_ids = set(int(option_id) for option_id in options_data.keys())
        if data_option_ids != db_option_ids:
            raise ValidationError(
                {"error": "You have to provide values for all options"}
            )

        # TODO: make this atomic
        for option_id, vote in options_data.items():
            option = options.get(pk=int(option_id))
            Y = self.parse_decimal_value(vote["Y"], min_value=-2)
            AssignmentVote.objects.create(option=option, value="Y", weight=Y)

            if poll.pollmethod in (
                AssignmentPoll.POLLMETHOD_YN,
                AssignmentPoll.POLLMETHOD_YNA,
            ):
                N = self.parse_decimal_value(vote["N"], min_value=-2)
                AssignmentVote.objects.create(option=option, value="N", weight=N)

            if poll.pollmethod == AssignmentPoll.POLLMETHOD_YNA:
                A = self.parse_decimal_value(vote["A"], min_value=-2)
                AssignmentVote.objects.create(option=option, value="A", weight=A)

        # Create votes for global no and global abstain
        first_option = options.first()
        if "global_no" in data and global_no_enabled:
            global_no = self.parse_decimal_value(data["votescast"], min_value=-2)
            AssignmentVote.objects.create(
                option=first_option, value="N", weight=global_no
            )
        if "global_abstain" in data and global_abstain_enabled:
            global_abstain = self.parse_decimal_value(data["votescast"], min_value=-2)
            AssignmentVote.objects.create(
                option=first_option, value="A", weight=global_abstain
            )

        poll.state = AssignmentPoll.STATE_FINISHED  # directly stop the poll
        poll.save()

    def validate_vote_data(self, data, poll):
        if poll.pollmethod == AssignmentPoll.POLLMETHOD_VOTES:
            if isinstance(data, dict):
                amount_sum = 0
                for option_id, amount in data.items():
                    if not is_int(option_id):
                        raise ValidationError({"detail": "Each id must be an int."})
                    if not is_int(amount):
                        raise ValidationError({"detail": "Each amounts must be int"})
                    amount = int(amount)
                    if amount < 1:
                        raise ValidationError({"detail": "At least 1 vote per option"})
                    if not poll.allow_multiple_votes_per_candidate and amount != 1:
                        raise ValidationError(
                            {"detail": "Multiple votes are not allowed"}
                        )
                    amount_sum += amount

                if amount_sum != poll.votes_amount:
                    raise ValidationError(
                        {
                            "detail": "You have to give exactly {0} votes",
                            "args": [poll.votes_amount],
                        }
                    )
                # Check, if all options are valid
                db_option_ids = set(option.id for option in poll.get_options())
                data_option_ids = set(int(option_id) for option_id in data.keys())
                if len(data_option_ids - db_option_ids):
                    raise ValidationError({"error": "There are invalid option ids."})
            elif data == "N" and poll.global_no:
                pass
            elif data == "A" and poll.global_abstain:
                pass
            else:
                raise ValidationError({"detail": "invalid data."})

        elif poll.pollmethod in (
            AssignmentPoll.POLLMETHOD_YN,
            AssignmentPoll.POLLMETHOD_YNA,
        ):
            if not isinstance(data, dict):
                raise ValidationError({"detail": "Data must be a dict."})
            for option_id, value in data.items():
                if not is_int(option_id):
                    raise ValidationError({"detail": "Keys must be int"})
                if poll.pollmethod == AssignmentPoll.POLLMETHOD_YNA and value not in (
                    "Y",
                    "N",
                    "A",
                ):
                    raise ValidationError("Every value must be Y, N or A")
                elif poll.pollmethod == AssignmentPoll.POLLMETHOD_YN and value not in (
                    "Y",
                    "N",
                ):
                    raise ValidationError("Every value must be Y or N")

            # Check, if all options were given
            db_option_ids = set(option.id for option in poll.get_options())
            data_option_ids = set(int(option_id) for option_id in data.keys())
            if data_option_ids != db_option_ids:
                raise ValidationError(
                    {"error": "You have to provide values for all options"}
                )

    def create_votes(self, data, poll, user=None):
        options = poll.get_options()
        if poll.pollmethod == AssignmentPoll.POLLMETHOD_VOTES:
            if isinstance(data, dict):
                for option_id, amount in data.items():
                    option = options.get(pk=option_id)
                    vote = AssignmentVote.objects.create(
                        option=option, user=user, weight=Decimal(amount), value="Y"
                    )
                    inform_changed_data(vote, no_delete_on_restriction=True)
            else:
                option = options.first()
                vote = AssignmentVote.objects.create(
                    option=option, user=user, weight=Decimal(1), value=data
                )
                inform_changed_data(vote, no_delete_on_restriction=True)
        elif poll.pollmethod in (
            AssignmentPoll.POLLMETHOD_YN,
            AssignmentPoll.POLLMETHOD_YNA,
        ):
            pass
            # TODO

    def handle_named_vote(self, data, poll, user):
        """
        Request data for votes pollmethod:
        {<option_id>: <amount>} | 'N' | 'A'
         - Exactly one of the three options must be given
         - 'N' is only valid if poll.global_no==True
         - 'A' is only valid if poll.global_abstain==True
         - amonts must be integer numbers >= 1.
         - ids should be integers of valid option ids for this poll
         - amounts must be one ("1"), if poll.allow_multiple_votes_per_candidate if False
         - The sum of all amounts must be poll.votes_amount votes

         Request data for YN/YNA pollmethod:
         {<option_id>: 'Y' | 'N' [|'A']}
          - all option_ids must be given
          - 'A' is only allowed in YNA pollmethod
        """
        self.validate_vote_data(data, poll)
        # Instead of reusing all existing votes for the user, delete all previous votes
        for vote in poll.get_votes().filter(user=user):
            vote.delete()
        self.create_votes(data, poll, user)

    def handle_pseudoanonymous_vote(self, data, poll):
        """
        For request data see handle_named_vote
        """
        self.validate_vote_data(data, poll)
        self.create_votes(data, poll)


class AssignmentVoteViewSet(BaseVoteViewSet):
    queryset = AssignmentVote.objects.all()

    def check_view_permissions(self):
        return has_perm(self.request.user, "assignments.can_see")
