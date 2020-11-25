from openslides.poll.serializers import (
    BASE_OPTION_FIELDS,
    BASE_POLL_FIELDS,
    BASE_VOTE_FIELDS,
    BaseOptionSerializer,
    BasePollSerializer,
    BaseVoteSerializer,
)
from openslides.utils.rest_api import (
    BooleanField,
    DecimalField,
    IdPrimaryKeyRelatedField,
    IntegerField,
    ModelSerializer,
    ValidationError,
)

from ..utils.auth import has_perm
from ..utils.autoupdate import inform_changed_data
from ..utils.validate import validate_html_strict
from .models import (
    Assignment,
    AssignmentOption,
    AssignmentPoll,
    AssignmentRelatedUser,
    AssignmentVote,
)


def posts_validator(data):
    """
    Validator for open posts. It checks that the values for the open posts are greater than 0.
    """
    if data["open_posts"] and data["open_posts"] is not None and data["open_posts"] < 1:
        raise ValidationError(
            {"detail": "Value for 'open_posts' must be greater than 0"}
        )
    return data


class AssignmentRelatedUserSerializer(ModelSerializer):
    """
    Serializer for assignment.models.AssignmentRelatedUser objects.
    """

    class Meta:
        model = AssignmentRelatedUser
        fields = ("id", "user", "weight")


class AssignmentVoteSerializer(BaseVoteSerializer):
    """
    Serializer for assignment.models.AssignmentVote objects.
    """

    class Meta:
        model = AssignmentVote
        fields = BASE_VOTE_FIELDS
        read_only_fields = BASE_VOTE_FIELDS


class AssignmentOptionSerializer(BaseOptionSerializer):
    """
    Serializer for assignment.models.AssignmentOption objects.
    """

    class Meta:
        model = AssignmentOption
        fields = ("user", "weight") + BASE_OPTION_FIELDS
        read_only_fields = ("user", "weight") + BASE_OPTION_FIELDS


class AssignmentPollSerializer(BasePollSerializer):
    """
    Serializer for assignment.models.AssignmentPoll objects.

    Serializes all polls.
    """

    amount_global_yes = DecimalField(
        max_digits=15, decimal_places=6, min_value=-2, read_only=True
    )
    amount_global_no = DecimalField(
        max_digits=15, decimal_places=6, min_value=-2, read_only=True
    )
    amount_global_abstain = DecimalField(
        max_digits=15, decimal_places=6, min_value=-2, read_only=True
    )

    class Meta:
        model = AssignmentPoll
        fields = (
            "assignment",
            "description",
            "pollmethod",
            "votes_amount",
            "allow_multiple_votes_per_candidate",
            "global_yes",
            "amount_global_yes",
            "global_no",
            "amount_global_no",
            "global_abstain",
            "amount_global_abstain",
        ) + BASE_POLL_FIELDS
        read_only_fields = ("state",)

    def update(self, instance, validated_data):
        """ Prevent updating the assignment """
        validated_data.pop("assignment", None)
        return super().update(instance, validated_data)

    def norm_100_percent_base_to_pollmethod(
        self, onehundred_percent_base, pollmethod, old_100_percent_base=None
    ):
        """
        Returns None, if the 100-%-base must not be changed, otherwise the correct 100-%-base.
        """
        if pollmethod == AssignmentPoll.POLLMETHOD_YN and onehundred_percent_base in (
            AssignmentPoll.PERCENT_BASE_Y,
            AssignmentPoll.PERCENT_BASE_YNA,
        ):
            return AssignmentPoll.PERCENT_BASE_YN
        if (
            pollmethod == AssignmentPoll.POLLMETHOD_YNA
            and onehundred_percent_base == AssignmentPoll.PERCENT_BASE_Y
        ):
            if old_100_percent_base is None:
                return AssignmentPoll.PERCENT_BASE_YNA
            else:
                if old_100_percent_base in (
                    AssignmentPoll.PERCENT_BASE_YN,
                    AssignmentPoll.PERCENT_BASE_YNA,
                ):
                    return old_100_percent_base
                else:
                    return pollmethod
        if pollmethod == AssignmentPoll.POLLMETHOD_Y and onehundred_percent_base in (
            AssignmentPoll.PERCENT_BASE_YN,
            AssignmentPoll.PERCENT_BASE_YNA,
        ):
            return AssignmentPoll.PERCENT_BASE_Y
        return None


class AssignmentSerializer(ModelSerializer):
    """
    Serializer for assignment.models.Assignment objects. With all polls.
    """

    assignment_related_users = AssignmentRelatedUserSerializer(
        many=True, read_only=True
    )
    agenda_create = BooleanField(write_only=True, required=False, allow_null=True)
    agenda_type = IntegerField(
        write_only=True, required=False, min_value=1, max_value=3, allow_null=True
    )
    agenda_parent_id = IntegerField(write_only=True, required=False, min_value=1)
    polls = IdPrimaryKeyRelatedField(many=True, read_only=True)

    class Meta:
        model = Assignment
        fields = (
            "id",
            "title",
            "description",
            "open_posts",
            "phase",
            "assignment_related_users",
            "default_poll_description",
            "agenda_item_id",
            "list_of_speakers_id",
            "agenda_create",
            "agenda_type",
            "agenda_parent_id",
            "tags",
            "attachments",
            "number_poll_candidates",
            "polls",
        )
        validators = (posts_validator,)

    def validate(self, data):
        if "description" in data:
            data["description"] = validate_html_strict(data["description"])
        return data

    def create(self, validated_data):
        """
        Customized create method. Set information about related agenda item
        into agenda_item_update_information container.
        """
        tags = validated_data.pop("tags", [])
        attachments = validated_data.pop("attachments", [])
        request_user = validated_data.pop("request_user")  # this should always be there
        agenda_create = validated_data.pop("agenda_create", None)
        agenda_type = validated_data.pop("agenda_type", None)
        agenda_parent_id = validated_data.pop("agenda_parent_id", None)

        assignment = Assignment(**validated_data)
        if has_perm(request_user, "agenda.can_manage"):
            assignment.agenda_item_update_information["create"] = agenda_create
            assignment.agenda_item_update_information["type"] = agenda_type
            assignment.agenda_item_update_information["parent_id"] = agenda_parent_id

        assignment.save()
        assignment.tags.add(*tags)
        assignment.attachments.add(*attachments)
        inform_changed_data(assignment)
        return assignment
