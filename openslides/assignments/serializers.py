from django.db import transaction

from openslides.poll.serializers import default_votes_validator
from openslides.utils.rest_api import (
    BooleanField,
    DecimalField,
    DictField,
    IntegerField,
    ListField,
    ModelSerializer,
    SerializerMethodField,
    ValidationError,
)

from ..utils.auth import has_perm
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
        fields = (
            "id",
            "user",
            "elected",
            "assignment",
            "weight",
        )  # js-data needs the assignment-id in the nested object to define relations.


class AssignmentVoteSerializer(ModelSerializer):
    """
    Serializer for assignment.models.AssignmentVote objects.
    """

    class Meta:
        model = AssignmentVote
        fields = ("weight", "value")


class AssignmentOptionSerializer(ModelSerializer):
    """
    Serializer for assignment.models.AssignmentOption objects.
    """

    votes = AssignmentVoteSerializer(many=True, read_only=True)
    is_elected = SerializerMethodField()

    class Meta:
        model = AssignmentOption
        fields = ("id", "candidate", "is_elected", "votes", "poll", "weight")

    def get_is_elected(self, obj):
        """
        Returns the election status of the candidate of this option.
        If the candidate is None (e.g. deleted) the result is False.
        """
        if not obj.candidate:
            return False
        return obj.poll.assignment.is_elected(obj.candidate)


class AssignmentAllPollSerializer(ModelSerializer):
    """
    Serializer for assignment.models.AssignmentPoll objects.

    Serializes all polls.
    """

    options = AssignmentOptionSerializer(many=True, read_only=True)
    votes = ListField(
        child=DictField(
            child=DecimalField(max_digits=15, decimal_places=6, min_value=-2)
        ),
        write_only=True,
        required=False,
    )
    has_votes = SerializerMethodField()

    class Meta:
        model = AssignmentPoll
        fields = (
            "id",
            "pollmethod",
            "description",
            "published",
            "options",
            "votesabstain",
            "votesno",
            "votesvalid",
            "votesinvalid",
            "votescast",
            "votes",
            "has_votes",
            "assignment",
        )  # js-data needs the assignment-id in the nested object to define relations.
        read_only_fields = ("pollmethod",)
        validators = (default_votes_validator,)

    def get_has_votes(self, obj):
        """
        Returns True if this poll has some votes.
        """
        return obj.has_votes()

    @transaction.atomic
    def update(self, instance, validated_data):
        """
        Customized update method for polls. To update votes use the write
        only field 'votes'.

        Example data for a 'pollmethod'='yna' poll with two candidates:

            "votes": [{"Yes": 10, "No": 4, "Abstain": -2},
                      {"Yes": -1, "No": 0, "Abstain": -2}]

        Example data for a 'pollmethod' ='yn' poll with two candidates:
            "votes": [{"Votes": 10}, {"Votes": 0}]
        """
        # Update votes.
        votes = validated_data.get("votes")
        if votes:
            options = list(instance.get_options())
            if len(votes) != len(options):
                raise ValidationError(
                    {
                        "detail": "You have to submit data for {0} candidates.",
                        "args": [len(options)],
                    }
                )
            for index, option in enumerate(options):
                if len(votes[index]) != len(instance.get_vote_values()):
                    raise ValidationError(
                        {
                            "detail": "You have to submit data for {0} vote values",
                            "args": [len(instance.get_vote_values())],
                        }
                    )
                for vote_value, __ in votes[index].items():
                    if vote_value not in instance.get_vote_values():
                        raise ValidationError(
                            {
                                "detail": "Vote value {0} is invalid.",
                                "args": [vote_value],
                            }
                        )
                instance.set_vote_objects_with_values(
                    option, votes[index], skip_autoupdate=True
                )

        # Update remaining writeable fields.
        instance.description = validated_data.get("description", instance.description)
        instance.published = validated_data.get("published", instance.published)
        instance.votesabstain = validated_data.get(
            "votesabstain", instance.votesabstain
        )
        instance.votesno = validated_data.get("votesno", instance.votesno)
        instance.votesvalid = validated_data.get("votesvalid", instance.votesvalid)
        instance.votesinvalid = validated_data.get(
            "votesinvalid", instance.votesinvalid
        )
        instance.votescast = validated_data.get("votescast", instance.votescast)
        instance.save()
        return instance


class AssignmentFullSerializer(ModelSerializer):
    """
    Serializer for assignment.models.Assignment objects. With all polls.
    """

    assignment_related_users = AssignmentRelatedUserSerializer(
        many=True, read_only=True
    )
    polls = AssignmentAllPollSerializer(many=True, read_only=True)
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
