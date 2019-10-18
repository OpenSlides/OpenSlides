from django.contrib.auth.models import AnonymousUser

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
    def check_view_permissions(self):
        """
        the vote view is checked seperately. For all other views manage permissions
        are required.
        """
        if self.action == "vote":
            return True
        else:
            return self.has_manage_permissions()

    def perform_create(self, serializer):
        poll = serializer.save()
        poll.create_options()

    def update(self, *args, **kwargs):
        """
        Customized view endpoint to update a motion poll.
        """
        poll = self.get_object()

        if poll.state != BasePoll.STATE_CREATED:
            raise ValidationError(
                {"detail": "You can just edit a poll if it was not started."}
            )

        return super().update(*args, **kwargs)

    @detail_route(methods=["POST"])
    def start(self, request, pk):
        poll = self.get_object()
        if poll.state != BasePoll.STATE_CREATED:
            raise ValidationError({"detail": "Wrong poll state"})
        poll.state = BasePoll.STATE_STARTED

        poll.save()
        inform_changed_data(poll.get_votes())
        return Response()

    @detail_route(methods=["POST"])
    def stop(self, request, pk):
        poll = self.get_object()
        if poll.state != BasePoll.STATE_STARTED:
            raise ValidationError({"detail": "Wrong poll state"})

        poll.state = BasePoll.STATE_FINISHED
        poll.save()
        inform_changed_data(poll.get_votes())
        return Response()

    @detail_route(methods=["POST"])
    def publish(self, request, pk):
        poll = self.get_object()
        if poll.state != BasePoll.STATE_FINISHED:
            raise ValidationError({"detail": "Wrong poll state"})

        poll.state = BasePoll.STATE_PUBLISHED
        poll.save()
        inform_changed_data(poll.get_votes())
        return Response()

    @detail_route(methods=["POST"])
    def pseudoanonymize(self, request, pk):
        poll = self.get_object()

        if poll.state not in (BasePoll.STATE_FINISHED, BasePoll.STATE_PUBLISHED):
            raise ValidationError(
                {"detail": "Pseudoanonmizing can only be done after a finished poll"}
            )
        if poll.type != BasePoll.TYPE_NAMED:
            raise ValidationError(
                {"detail": "You can just pseudoanonymize named polls"}
            )

        poll.pseudoanonymize()
        return Response()

    @detail_route(methods=["POST"])
    def reset(self, request, pk):
        poll = self.get_object()

        if poll.state not in (BasePoll.STATE_FINISHED, BasePoll.STATE_PUBLISHED):
            raise ValidationError(
                {"detail": "You can only reset this poll after it is finished"}
            )

        poll.reset()
        return Response()

    @detail_route(methods=["POST"])
    def vote(self, request, pk):
        """
        For motion polls: Just "Y", "N" or "A" (if pollmethod is "YNA")
        """
        poll = self.get_object()
        if poll.state != BasePoll.STATE_STARTED:
            raise ValidationError({"detail": "You cannot vote for an unstarted poll"})

        if isinstance(request.user, AnonymousUser):
            self.permission_denied(request)

        # check permissions based on poll type and handle requests
        if poll.type == BasePoll.TYPE_ANALOG:
            if not self.has_manage_permissions():
                self.permission_denied(request)

            self.handle_analog_vote(request.data, poll, request.user)
            # special: change the poll state to finished.
            poll.state = BasePoll.STATE_FINISHED
            poll.save()

        elif poll.type == BasePoll.TYPE_NAMED:
            self.assert_can_vote(poll, request)
            self.handle_named_vote(request.data, poll, request.user)
            poll.voted.add(request.user)

        elif poll.type == BasePoll.TYPE_PSEUDOANONYMOUS:
            self.assert_can_vote(poll, request)

            if request.user in poll.voted.all():
                raise ValidationError(
                    {"detail": "You have already voted for this poll."}
                )
            self.handle_pseudoanonymous_vote(request.data, poll)
            poll.voted.add(request.user)

        inform_changed_data(poll)  # needed for the changed voted relation
        return Response()

    def assert_can_vote(self, poll, request):
        """
        Raises a permission denied, if the user is not in a poll group
        and present
        """
        if not request.user.is_present or not in_some_groups(
            request.user.id, poll.groups.all(), exact=True
        ):
            self.permission_denied(request)

    def parse_decimal_value(self, value, min_value=None):
        """ Raises a ValidationError on incorrect values """
        field = DecimalField(min_value=min_value, max_digits=15, decimal_places=6)
        return field.to_internal_value(value)


class BaseVoteViewSet(ListModelMixin, RetrieveModelMixin, GenericViewSet):
    pass
