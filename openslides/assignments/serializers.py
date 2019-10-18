from openslides.poll.serializers import (
    BASE_OPTION_FIELDS,
    BASE_POLL_FIELDS,
    BASE_VOTE_FIELDS,
)
from openslides.utils.rest_api import (
    BooleanField,
    CharField,
    DecimalField,
    IdPrimaryKeyRelatedField,
    IntegerField,
    ModelSerializer,
    SerializerMethodField,
    ValidationError,
)

from ..utils.auth import get_group_model, has_perm
from ..utils.autoupdate import inform_changed_data
from ..utils.validate import validate_html
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
        fields = ("id", "user", "elected", "weight")


class AssignmentVoteSerializer(ModelSerializer):
    """
    Serializer for assignment.models.AssignmentVote objects.
    """

    pollstate = SerializerMethodField()

    class Meta:
        model = AssignmentVote
        fields = ("pollstate",) + BASE_VOTE_FIELDS
        read_only_fields = BASE_VOTE_FIELDS

    def get_pollstate(self, vote):
        return vote.option.poll.state


class AssignmentOptionSerializer(ModelSerializer):
    """
    Serializer for assignment.models.AssignmentOption objects.
    """

    yes = DecimalField(max_digits=15, decimal_places=6, min_value=-2, read_only=True)
    no = DecimalField(max_digits=15, decimal_places=6, min_value=-2, read_only=True)
    abstain = DecimalField(
        max_digits=15, decimal_places=6, min_value=-2, read_only=True
    )

    votes = IdPrimaryKeyRelatedField(many=True, read_only=True)

    class Meta:
        model = AssignmentOption
        fields = ("user",) + BASE_OPTION_FIELDS
        read_only_fields = ("user",) + BASE_OPTION_FIELDS


class AssignmentPollSerializer(ModelSerializer):
    """
    Serializer for assignment.models.AssignmentPoll objects.

    Serializes all polls.
    """

    options = AssignmentOptionSerializer(many=True, read_only=True)

    title = CharField(allow_blank=False, required=True)
    groups = IdPrimaryKeyRelatedField(
        many=True, required=False, queryset=get_group_model().objects.all()
    )
    voted = IdPrimaryKeyRelatedField(many=True, read_only=True)

    votesvalid = DecimalField(
        max_digits=15, decimal_places=6, min_value=-2, read_only=True
    )
    votesinvalid = DecimalField(
        max_digits=15, decimal_places=6, min_value=-2, read_only=True
    )
    votescast = DecimalField(
        max_digits=15, decimal_places=6, min_value=-2, read_only=True
    )

    class Meta:
        model = AssignmentPoll
        fields = (
            "assignment",
            "pollmethod",
            "votes_amount",
            "allow_multiple_votes_per_candidate",
            "global_no",
            "global_abstain",
        ) + BASE_POLL_FIELDS
        read_only_fields = ("state",)

    def update(self, instance, validated_data):
        """ Prevent from updating the assignment """
        validated_data.pop("assignment", None)
        return super().update(instance, validated_data)


class AssignmentSerializer(ModelSerializer):
    """
    Serializer for assignment.models.Assignment objects. With all polls.
    """

    assignment_related_users = AssignmentRelatedUserSerializer(
        many=True, read_only=True
    )
    polls = IdPrimaryKeyRelatedField(many=True, read_only=True)
    agenda_create = BooleanField(write_only=True, required=False, allow_null=True)
    agenda_type = IntegerField(
        write_only=True, required=False, min_value=1, max_value=3, allow_null=True
    )
    agenda_parent_id = IntegerField(write_only=True, required=False, min_value=1)

    class Meta:
        model = Assignment
        fields = (
            "id",
            "title",
            "description",
            "open_posts",
            "phase",
            "assignment_related_users",
            "poll_description_default",
            "polls",
            "agenda_item_id",
            "list_of_speakers_id",
            "agenda_create",
            "agenda_type",
            "agenda_parent_id",
            "tags",
            "attachments",
        )
        validators = (posts_validator,)

    def validate(self, data):
        if "description" in data:
            data["description"] = validate_html(data["description"])
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
