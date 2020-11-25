from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db import transaction

from openslides.core.config import config
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
    partial_update, update, destroy, candidature_self, candidature_other and create_poll.
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

    @detail_route(methods=["post", "delete"])
    def candidature_other(self, request, pk=None):
        """
        View to nominate other users (POST) or delete their candidature
        status (DELETE). The client has to send {'user': <id>}.
        """
        user_id = request.data.get("user")
        if not isinstance(user_id, int):
            raise ValidationError({"detail": "user_id must be an int."})

        try:
            user = get_user_model().objects.get(pk=user_id)
        except get_user_model().DoesNotExist:
            raise ValidationError(
                {"detail": "Invalid data. User {0} does not exist.", "args": [user_id]}
            )

        assignment = self.get_object()
        if request.method == "POST":
            return self.nominate_other(request, user, assignment)
        else:
            # request.method == 'DELETE'
            return self.withdraw_other(request, user, assignment)

    def nominate_other(self, request, user, assignment):
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

    def withdraw_other(self, request, user, assignment):
        # To delete candidature status you have to be a manager.
        if not has_perm(request.user, "assignments.can_manage"):
            self.permission_denied(request)
        if assignment.phase == assignment.PHASE_FINISHED:
            raise ValidationError(
                {
                    "detail": "You can not delete someone's candidature to this election because it is finished."
                }
            )
        if not assignment.is_candidate(user):
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
        poll = AssignmentPoll.objects.get(pk=serializer.data["id"])
        poll.db_amount_global_yes = Decimal(0)
        poll.db_amount_global_no = Decimal(0)
        poll.db_amount_global_abstain = Decimal(0)
        poll.save()

    def handle_analog_vote(self, data, poll):
        for field in ["votesvalid", "votesinvalid", "votescast"]:
            setattr(poll, field, data[field])

        global_yes_enabled = poll.global_yes and poll.pollmethod in (
            AssignmentPoll.POLLMETHOD_Y,
            AssignmentPoll.POLLMETHOD_N,
        )
        if global_yes_enabled:
            poll.amount_global_yes = data.get("amount_global_yes", Decimal(0))

        global_no_enabled = poll.global_no and poll.pollmethod in (
            AssignmentPoll.POLLMETHOD_Y,
            AssignmentPoll.POLLMETHOD_N,
        )
        if global_no_enabled:
            poll.amount_global_no = data.get("amount_global_no", Decimal(0))

        global_abstain_enabled = poll.global_abstain and poll.pollmethod in (
            AssignmentPoll.POLLMETHOD_Y,
            AssignmentPoll.POLLMETHOD_N,
        )
        if global_abstain_enabled:
            poll.amount_global_abstain = data.get("amount_global_abstain", Decimal(0))

        options = poll.get_options()
        options_data = data.get("options")

        with transaction.atomic():
            for option_id, vote in options_data.items():
                option = options.get(pk=int(option_id))

                if poll.pollmethod == AssignmentPoll.POLLMETHOD_N:
                    vote_obj, _ = AssignmentVote.objects.get_or_create(
                        option=option, value="N"
                    )
                    vote_obj.weight = vote["N"]
                    vote_obj.save()

                elif poll.pollmethod in (
                    AssignmentPoll.POLLMETHOD_Y,
                    AssignmentPoll.POLLMETHOD_YN,
                    AssignmentPoll.POLLMETHOD_YNA,
                ):
                    # All three methods have a Y
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

                else:
                    raise NotImplementedError(
                        f"handle_analog_vote not implemented for {poll.pollmethod}"
                    )
                inform_changed_data(option)

            poll.save()

    def validate_vote_data(self, data, poll):
        """
        Request data:
        analog:
            {
                "options": {<option_id>: {"Y": <amount>, ["N": <amount>], ["A": <amount>] }},
                ["votesvalid": <amount>], ["votesinvalid": <amount>], ["votescast": <amount>],
                ["amount_global_yes": <amount>],
                ["amount_global_no": <amount>],
                ["amount_global_abstain": <amount>]
            }
            All amounts are decimals as strings
            required fields per pollmethod:
            - votes: Y
            - YN:    YN
            - YNA:   YNA
            - N:     N
        named|pseudoanonymous:
            votes:
                {<option_id>: <amount>} | 'Y' | 'N' | 'A'
                - Exactly one of the three options must be given
                - 'Y' is only valid if poll.global_yes==True
                - 'N' is only valid if poll.global_no==True
                - 'A' is only valid if poll.global_abstain==True
                - amounts must be integer numbers >= 0.
                - ids should be integers of valid option ids for this poll
                - amounts must be 0 or 1, if poll.allow_multiple_votes_per_candidate is False
                - if an option is not given, 0 is assumed
                - The sum of all amounts must be grater than 0 and <= poll.votes_amount

            YN/YNA:
                {<option_id>: 'Y' | 'N' [|'A']}
                - 'A' is only allowed in YNA pollmethod
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
                if poll.pollmethod == AssignmentPoll.POLLMETHOD_N:
                    value["N"] = self.parse_vote_value(value, "N")
                else:
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

            global_yes_enabled = poll.global_yes and poll.pollmethod in (
                AssignmentPoll.POLLMETHOD_Y,
                AssignmentPoll.POLLMETHOD_N,
            )
            if "amount_global_yes" in data and global_yes_enabled:
                data["amount_global_yes"] = self.parse_vote_value(
                    data, "amount_global_yes"
                )

            global_no_enabled = poll.global_no and poll.pollmethod in (
                AssignmentPoll.POLLMETHOD_Y,
                AssignmentPoll.POLLMETHOD_N,
            )
            if "amount_global_no" in data and global_no_enabled:
                data["amount_global_no"] = self.parse_vote_value(
                    data, "amount_global_no"
                )

            global_abstain_enabled = poll.global_abstain and poll.pollmethod in (
                AssignmentPoll.POLLMETHOD_Y,
                AssignmentPoll.POLLMETHOD_N,
            )
            if "amount_global_abstain" in data and global_abstain_enabled:
                data["amount_global_abstain"] = self.parse_vote_value(
                    data, "amount_global_abstain"
                )

        else:  # non-analog polls
            if isinstance(data, dict) and len(data) == 0:
                raise ValidationError({"details": "Empty ballots are not allowed"})
            available_options = poll.get_options()
            if poll.pollmethod in (
                AssignmentPoll.POLLMETHOD_Y,
                AssignmentPoll.POLLMETHOD_N,
            ):
                if isinstance(data, dict):
                    amount_sum = 0
                    for option_id, amount in data.items():
                        if not is_int(option_id):
                            raise ValidationError({"detail": "Each id must be an int."})
                        if not available_options.filter(id=option_id).exists():
                            raise ValidationError(
                                {"detail": f"Option {option_id} does not exist."}
                            )
                        if not is_int(amount):
                            raise ValidationError({"detail": "Each amount must be int"})
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

                    if amount_sum > poll.votes_amount:
                        raise ValidationError(
                            {
                                "detail": "You can give a maximum of {0} votes",
                                "args": [poll.votes_amount],
                            }
                        )
                # return, if there is a global vote, because we dont have to check option presence
                elif data == "Y" and poll.global_yes:
                    return
                elif data == "N" and poll.global_no:
                    return
                elif data == "A" and poll.global_abstain:
                    return
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
                    if not available_options.filter(id=option_id).exists():
                        raise ValidationError(
                            {"detail": f"Option {option_id} does not exist."}
                        )
                    if (
                        poll.pollmethod == AssignmentPoll.POLLMETHOD_YNA
                        and value not in ("Y", "N", "A")
                    ):
                        raise ValidationError(
                            {"detail": "Every value must be Y, N or A"}
                        )
                    elif (
                        poll.pollmethod == AssignmentPoll.POLLMETHOD_YN
                        and value not in ("Y", "N")
                    ):
                        raise ValidationError({"detail": "Every value must be Y or N"})

            options_data = data

    def create_votes_type_votes(self, data, poll, vote_weight, vote_user, request_user):
        """
        Helper function for handle_(named|pseudoanonymous)_vote
        Assumes data is already validated
        vote_user is the user whose vote is given
        request_user is the user who gives the vote, may be a delegate
        """
        options = poll.get_options()
        if isinstance(data, dict):
            for option_id, amount in data.items():
                # Add user to the option's voted array
                option = options.get(pk=option_id)
                # skip creating votes with empty weights
                if amount == 0:
                    continue
                weight = Decimal(amount)
                if config["users_activate_vote_weight"]:
                    weight *= vote_weight
                value = "Y"  # POLLMETHOD_Y
                if poll.pollmethod == AssignmentPoll.POLLMETHOD_N:
                    value = "N"
                vote = AssignmentVote.objects.create(
                    option=option,
                    user=vote_user,
                    delegated_user=request_user,
                    weight=weight,
                    value=value,
                )
                inform_changed_data(vote, no_delete_on_restriction=True)
        else:  # global_no or global_abstain
            option = options[0]
            weight = vote_weight if config["users_activate_vote_weight"] else Decimal(1)
            vote = AssignmentVote.objects.create(
                option=option,
                user=vote_user,
                delegated_user=request_user,
                weight=weight,
                value=data,
            )
            inform_changed_data(vote, no_delete_on_restriction=True)
            inform_changed_data(option)
            inform_changed_data(poll)

    def create_votes_types_yn_yna(
        self, data, poll, vote_weight, vote_user, request_user
    ):
        """
        Helper function for handle_(named|pseudoanonymous)_vote
        Assumes data is already validated
        vote_user is the user whose vote is given
        request_user is the user who gives the vote, may be a delegate
        """
        options = poll.get_options()
        weight = vote_weight if config["users_activate_vote_weight"] else Decimal(1)
        for option_id, result in data.items():
            option = options.get(pk=option_id)
            vote = AssignmentVote.objects.create(
                option=option,
                user=vote_user,
                delegated_user=request_user,
                value=result,
                weight=weight,
            )
            inform_changed_data(vote, no_delete_on_restriction=True)
            inform_changed_data(option, no_delete_on_restriction=True)

    def add_user_to_voted_array(self, user, poll):
        VotedModel = AssignmentPoll.voted.through
        VotedModel.objects.create(assignmentpoll=poll, user=user)

    def handle_named_vote(self, data, poll, vote_user, request_user):
        if poll.pollmethod in (
            AssignmentPoll.POLLMETHOD_Y,
            AssignmentPoll.POLLMETHOD_N,
        ):
            self.create_votes_type_votes(
                data, poll, vote_user.vote_weight, vote_user, request_user
            )
        elif poll.pollmethod in (
            AssignmentPoll.POLLMETHOD_YN,
            AssignmentPoll.POLLMETHOD_YNA,
        ):
            self.create_votes_types_yn_yna(
                data, poll, vote_user.vote_weight, vote_user, request_user
            )
        else:
            raise NotImplementedError(f"The method {poll.pollmethod} is not supported!")

    def handle_pseudoanonymous_vote(self, data, poll, user):
        if poll.pollmethod in (
            AssignmentPoll.POLLMETHOD_Y,
            AssignmentPoll.POLLMETHOD_N,
        ):
            self.create_votes_type_votes(data, poll, user.vote_weight, None, None)
        elif poll.pollmethod in (
            AssignmentPoll.POLLMETHOD_YN,
            AssignmentPoll.POLLMETHOD_YNA,
        ):
            self.create_votes_types_yn_yna(data, poll, user.vote_weight, None, None)
        else:
            raise NotImplementedError(f"The method {poll.pollmethod} is not supported!")

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
