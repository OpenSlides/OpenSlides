from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db import transaction

from openslides.poll.views import BaseOptionViewSet, BasePollViewSet, BaseVoteViewSet
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
from .models import (
    Assignment,
    AssignmentOption,
    AssignmentPoll,
    AssignmentRelatedUser,
    AssignmentVote,
)


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
                {"detail": "Cannot create poll because there are no candidates."}
            )

        super().perform_create(serializer)

    def handle_analog_vote(self, data, poll, user):
        for field in ["votesvalid", "votesinvalid", "votescast"]:
            setattr(poll, field, data[field])

        global_no_enabled = (
            poll.global_no and poll.pollmethod == AssignmentPoll.POLLMETHOD_VOTES
        )
        global_abstain_enabled = (
            poll.global_abstain and poll.pollmethod == AssignmentPoll.POLLMETHOD_VOTES
        )

        options = poll.get_options()
        options_data = data.get("options")

        with transaction.atomic():
            for option_id, vote in options_data.items():
                option = options.get(pk=int(option_id))
                vote_obj, _ = AssignmentVote.objects.get_or_create(
                    option=option, value="Y"
                )
                vote_obj.weight = vote["Y"]
                vote_obj.save()

                if poll.pollmethod in (
                    AssignmentPoll.POLLMETHOD_YN,
                    AssignmentPoll.POLLMETHOD_YNA,
                ):
                    vote_obj, _ = AssignmentVote.objects.get_or_create(
                        option=option, value="N"
                    )
                    vote_obj.weight = vote["N"]
                    vote_obj.save()

                if poll.pollmethod == AssignmentPoll.POLLMETHOD_YNA:
                    vote_obj, _ = AssignmentVote.objects.get_or_create(
                        option=option, value="A"
                    )
                    vote_obj.weight = vote["A"]
                    vote_obj.save()

            # Create votes for global no and global abstain
            first_option = options.first()
            if "global_no" in data and global_no_enabled:
                vote_obj, _ = AssignmentVote.objects.get_or_create(
                    option=first_option, value="N"
                )
                vote_obj.weight = data["votescast"]
                vote_obj.save()
            if "global_abstain" in data and global_abstain_enabled:
                vote_obj, _ = AssignmentVote.objects.get_or_create(
                    option=first_option, value="A"
                )
                vote_obj.weight = data["votescast"]
                vote_obj.save()
            poll.save()

    def validate_vote_data(self, data, poll):
        """
        Request data:
        analog:
            {
                "options": {<option_id>: {"Y": <amount>, ["N": <amount>], ["A": <amount>] }},
                ["votesvalid": <amount>], ["votesinvalid": <amount>], ["votescast": <amount>],
                ["global_no": <amount>], ["global_abstain": <amount>]
            }
            All amounts are decimals as strings
            required fields per pollmethod:
            - votes: Y
            - YN:    YN
            - YNA:   YNA
        named|pseudoanonymous:
            votes:
                {<option_id>: <amount>} | 'N' | 'A'
                - Exactly one of the three options must be given
                - 'N' is only valid if poll.global_no==True
                - 'A' is only valid if poll.global_abstain==True
                - amounts must be integer numbers >= 0.
                - ids should be integers of valid option ids for this poll
                - amounts must be 0 or 1, if poll.allow_multiple_votes_per_candidate is False
                - The sum of all amounts must be poll.votes_amount votes

            YN/YNA:
                {<option_id>: 'Y' | 'N' [|'A']}
                - all option_ids must be given
                - 'A' is only allowed in YNA pollmethod

        Votes for all options have to be given
        """
        if poll.type == AssignmentPoll.TYPE_ANALOG:
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
                value["Y"] = self.parse_vote_value(value, "Y")
                if poll.pollmethod in (
                    AssignmentPoll.POLLMETHOD_YN,
                    AssignmentPoll.POLLMETHOD_YNA,
                ):
                    value["N"] = self.parse_vote_value(value, "N")
                if poll.pollmethod == AssignmentPoll.POLLMETHOD_YNA:
                    value["A"] = self.parse_vote_value(value, "A")

            for field in ["votesvalid", "votesinvalid", "votescast"]:
                data[field] = self.parse_vote_value(data, field)

            global_no_enabled = (
                poll.global_no and poll.pollmethod == AssignmentPoll.POLLMETHOD_VOTES
            )
            global_abstain_enabled = (
                poll.global_abstain
                and poll.pollmethod == AssignmentPoll.POLLMETHOD_VOTES
            )
            if ("global_no" in data and global_no_enabled) or (
                "global_abstain" in data and global_abstain_enabled
            ):
                data["votescast"] = self.parse_vote_value(data, "votescast")

        else:
            if poll.pollmethod == AssignmentPoll.POLLMETHOD_VOTES:
                if isinstance(data, dict):
                    amount_sum = 0
                    for option_id, amount in data.items():
                        if not is_int(option_id):
                            raise ValidationError({"detail": "Each id must be an int."})
                        if not is_int(amount):
                            raise ValidationError(
                                {"detail": "Each amounts must be int"}
                            )
                        amount = int(amount)
                        if amount < 0:
                            raise ValidationError(
                                {"detail": "Negative votes are not allowed"}
                            )
                        # skip empty votes
                        if amount == 0:
                            continue
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
                elif data == "N" and poll.global_no:
                    return  # return because we dont have to check option presence
                elif data == "A" and poll.global_abstain:
                    return  # return because we dont have to check option presence
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
                    if (
                        poll.pollmethod == AssignmentPoll.POLLMETHOD_YNA
                        and value not in ("Y", "N", "A",)
                    ):
                        raise ValidationError("Every value must be Y, N or A")
                    elif (
                        poll.pollmethod == AssignmentPoll.POLLMETHOD_YN
                        and value not in ("Y", "N",)
                    ):
                        raise ValidationError("Every value must be Y or N")

            options_data = data

        # Check if all options were given
        db_option_ids = set(option.id for option in poll.get_options())
        data_option_ids = set(int(option_id) for option_id in options_data.keys())
        if data_option_ids != db_option_ids:
            raise ValidationError(
                {"error": "You have to provide values for all options"}
            )

    def create_votes(self, data, poll, user=None):
        """
        Helper function for handle_(named|pseudoanonymous)_vote
        Assumes data is already validated
        """
        options = poll.get_options()
        if poll.pollmethod == AssignmentPoll.POLLMETHOD_VOTES:
            if isinstance(data, dict):
                for option_id, amount in data.items():
                    # skip empty votes
                    if amount == 0:
                        continue
                    option = options.get(pk=option_id)
                    vote = AssignmentVote.objects.create(
                        option=option, user=user, weight=Decimal(amount), value="Y"
                    )
                    inform_changed_data(vote, no_delete_on_restriction=True)
            else:  # global_no or global_abstain
                option = options.first()
                vote = AssignmentVote.objects.create(
                    option=option,
                    user=user,
                    weight=Decimal(poll.votes_amount),
                    value=data,
                )
                inform_changed_data(vote, no_delete_on_restriction=True)
        elif poll.pollmethod in (
            AssignmentPoll.POLLMETHOD_YN,
            AssignmentPoll.POLLMETHOD_YNA,
        ):
            for option_id, result in data.items():
                option = options.get(pk=option_id)
                vote = AssignmentVote.objects.create(
                    option=option, user=user, value=result
                )
                inform_changed_data(vote, no_delete_on_restriction=True)

    def handle_named_vote(self, data, poll, user):
        # Instead of reusing all existing votes for the user, delete all previous votes
        for vote in poll.get_votes().filter(user=user):
            vote.delete()
        self.create_votes(data, poll, user)

    def handle_pseudoanonymous_vote(self, data, poll):
        self.create_votes(data, poll)

    def convert_option_data(self, poll, data):
        poll_options = poll.get_options()
        new_option_data = {}
        option_data = data.get("options")
        if option_data is None:
            raise ValidationError({"detail": "You must provide options"})
        for id, val in option_data.items():
            option = poll_options.filter(user_id=id).first()
            if option is None:
                raise ValidationError(
                    {"detail": f"Assignment related user with id {id} not found"}
                )
            new_option_data[option.id] = val
        data["options"] = new_option_data


class AssignmentOptionViewSet(BaseOptionViewSet):
    queryset = AssignmentOption.objects.all()

    def check_view_permissions(self):
        return has_perm(self.request.user, "assignments.can_see")


class AssignmentVoteViewSet(BaseVoteViewSet):
    queryset = AssignmentVote.objects.all()

    def check_view_permissions(self):
        return has_perm(self.request.user, "assignments.can_see")
