from textwrap import dedent

from django.contrib.auth.models import AnonymousUser
from django.db import transaction
from django.db.utils import IntegrityError
from rest_framework import status

from openslides.utils.auth import in_some_groups
from openslides.utils.autoupdate import inform_changed_data
from openslides.utils.rest_api import (
    DecimalField,
    GenericViewSet,
    ListModelMixin,
    ModelViewSet,
    Response,
    RetrieveModelMixin,
    ValidationError,
    detail_route,
)

from .models import BasePoll


class BasePollViewSet(ModelViewSet):
    valid_update_keys = [
        "majority_method",
        "onehundred_percent_base",
        "title",
        "description",
    ]

    def check_view_permissions(self):
        """
        the vote view is checked seperately. For all other views manage permissions
        are required.
        """
        if self.action == "vote":
            return True
        else:
            return self.has_manage_permissions()

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # for analog polls, votes can be given directly when the poll is created
        # for assignment polls, the options do not exist yet, so the AssignmentRelatedUser ids are needed
        if "votes" in request.data:
            poll = serializer.save()
            poll.create_options()
            self.handle_request_with_votes(request, poll)
        else:
            self.perform_create(serializer)

        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data, status=status.HTTP_201_CREATED, headers=headers
        )

    def perform_create(self, serializer):
        poll = serializer.save()
        poll.create_options()

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        """
        Customized view endpoint to update a poll.
        """
        poll = self.get_object()

        partial = kwargs.get("partial", False)
        serializer = self.get_serializer(poll, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=False)

        if poll.state != BasePoll.STATE_CREATED:
            invalid_keys = set(serializer.validated_data.keys()) - set(
                self.valid_update_keys
            )
            if len(invalid_keys):
                raise ValidationError(
                    {
                        "detail": dedent(
                            f"""
                            The poll is not in the created state.
                            You can only edit: {', '.join(self.valid_update_keys)}.
                            You provided the invalid keys: {', '.join(invalid_keys)}.
                        """
                        )
                    }
                )

        if "votes" in request.data:
            self.handle_request_with_votes(request, poll)
        return super().update(request, *args, **kwargs)

    def handle_request_with_votes(self, request, poll):
        if poll.type != BasePoll.TYPE_ANALOG:
            raise ValidationError(
                {"detail": "You cannot enter votes for a non-analog poll."}
            )

        vote_data = request.data["votes"]
        # convert user ids to option ids
        self.convert_option_data(poll, vote_data)

        self.validate_vote_data(vote_data, poll, request.user)
        self.handle_analog_vote(vote_data, poll, request.user)

        if request.data.get("publish_immediately"):
            poll.state = BasePoll.STATE_PUBLISHED
        elif (
            poll.state != BasePoll.STATE_PUBLISHED
        ):  # only set to finished if not already published
            poll.state = BasePoll.STATE_FINISHED
        poll.save()

    @detail_route(methods=["POST"])
    @transaction.atomic
    def start(self, request, pk):
        poll = self.get_object()
        if poll.state != BasePoll.STATE_CREATED:
            raise ValidationError({"detail": "Wrong poll state"})
        poll.state = BasePoll.STATE_STARTED

        poll.save()
        inform_changed_data(poll.get_votes())
        return Response()

    @detail_route(methods=["POST"])
    @transaction.atomic
    def stop(self, request, pk):
        poll = self.get_object()
        # Analog polls could not be stopped; they are stopped when
        # the results are entered.
        if poll.type == BasePoll.TYPE_ANALOG:
            raise ValidationError(
                {"detail": "Analog polls can not be stopped. Please enter votes."}
            )

        if poll.state != BasePoll.STATE_STARTED:
            raise ValidationError({"detail": "Wrong poll state"})

        poll.state = BasePoll.STATE_FINISHED
        poll.save()
        inform_changed_data(poll.get_votes())
        inform_changed_data(poll.get_options())
        return Response()

    @detail_route(methods=["POST"])
    @transaction.atomic
    def publish(self, request, pk):
        poll = self.get_object()
        if poll.state != BasePoll.STATE_FINISHED:
            raise ValidationError({"detail": "Wrong poll state"})

        poll.state = BasePoll.STATE_PUBLISHED
        poll.save()
        inform_changed_data(
            (vote.user for vote in poll.get_votes().all() if vote.user), final_data=True
        )
        inform_changed_data(poll.get_votes(), final_data=True)
        inform_changed_data(poll.get_options(), final_data=True)
        return Response()

    @detail_route(methods=["POST"])
    @transaction.atomic
    def pseudoanonymize(self, request, pk):
        poll = self.get_object()

        if poll.state not in (BasePoll.STATE_FINISHED, BasePoll.STATE_PUBLISHED):
            raise ValidationError(
                {"detail": "Pseudoanonymizing can only be done after finishing a poll"}
            )
        if poll.type != BasePoll.TYPE_NAMED:
            raise ValidationError(
                {"detail": "You can just pseudoanonymize named polls"}
            )

        poll.pseudoanonymize()
        return Response()

    @detail_route(methods=["POST"])
    @transaction.atomic
    def reset(self, request, pk):
        poll = self.get_object()
        poll.reset()
        return Response()

    @detail_route(methods=["POST"])
    @transaction.atomic
    def vote(self, request, pk):
        """
        For motion polls: Just "Y", "N" or "A" (if pollmethod is "YNA")
        """
        poll = self.get_object()

        if isinstance(request.user, AnonymousUser):
            self.permission_denied(request)

        # check permissions based on poll type and handle requests
        self.assert_can_vote(poll, request)

        data = request.data
        self.validate_vote_data(data, poll, request.user)

        if poll.type == BasePoll.TYPE_ANALOG:
            self.handle_analog_vote(data, poll, request.user)
            if request.data.get("publish_immediately") == "1":
                poll.state = BasePoll.STATE_PUBLISHED
            else:
                poll.state = BasePoll.STATE_FINISHED
            poll.save()

        elif poll.type == BasePoll.TYPE_NAMED:
            self.handle_named_vote(data, poll, request.user)

        elif poll.type == BasePoll.TYPE_PSEUDOANONYMOUS:
            self.handle_pseudoanonymous_vote(data, poll, request.user)

        inform_changed_data(poll)

        return Response()

    def assert_can_vote(self, poll, request):
        """
        Raises a permission denied, if the user is not allowed to vote (or has already voted).
        Adds the user to the voted array, so this needs to be reverted on error!
        Analog:                     has to have manage permissions
        Named & Pseudoanonymous:    has to be in a poll group and present
        """
        if poll.type == BasePoll.TYPE_ANALOG:
            if not self.has_manage_permissions():
                self.permission_denied(request)
        else:
            if poll.state != BasePoll.STATE_STARTED:
                raise ValidationError("You can only vote on a started poll.")

            if not request.user.is_present or not in_some_groups(
                request.user.id,
                list(poll.groups.values_list("pk", flat=True)),
                exact=True,
            ):
                self.permission_denied(request)

            try:
                self.add_user_to_voted_array(request.user, poll)
                inform_changed_data(poll)
            except IntegrityError:
                raise ValidationError({"detail": "You have already voted"})

    def parse_vote_value(self, obj, key):
        """ Raises a ValidationError on incorrect values, including None """
        if key not in obj:
            raise ValidationError({"detail": f"The field {key} is required"})
        field = DecimalField(min_value=-2, max_digits=15, decimal_places=6)
        value = field.to_internal_value(obj[key])
        if value < 0 and value != -1 and value != -2:
            raise ValidationError(
                {
                    "detail": "No fractional negative values allowed, only the special values -1 and -2"
                }
            )
        return value

    def convert_option_data(self, poll, data):
        """
        May be overwritten by subclass. Adjusts the option data based on the now existing poll
        """
        pass

    def add_user_to_voted_array(self, user, poll):
        """
        To be implemented by subclass. Adds the given user to the voted array of the given poll.
        This operation should be atomic: If the user is already in the array, an IntegrityError must
        be thrown, otherwise the user must be added.
        """
        raise NotImplementedError()

    def validate_vote_data(self, data, poll, user):
        """
        To be implemented by subclass. Validates the data according to poll type and method and fields by validated versions.
        Raises ValidationError on failure
        """
        raise NotImplementedError()

    def handle_analog_vote(self, data, poll, user):
        """
        To be implemented by subclass. Handles the analog vote. Assumes data is validated
        """
        raise NotImplementedError()

    def handle_named_vote(self, data, poll, user):
        """
        To be implemented by subclass. Handles the named vote. Assumes data is validated.
        Needs to manage the voted-array per option.
        """
        raise NotImplementedError()

    def handle_pseudoanonymous_vote(self, data, poll, user):
        """
        To be implemented by subclass. Handles the pseudoanonymous vote. Assumes data
        is validated. Needs to check, if the vote is allowed by the voted-array per poll.
        Needs to add the user to the voted-array.
        """
        raise NotImplementedError()


class BaseVoteViewSet(ListModelMixin, RetrieveModelMixin, GenericViewSet):
    pass


class BaseOptionViewSet(ListModelMixin, RetrieveModelMixin, GenericViewSet):
    pass
