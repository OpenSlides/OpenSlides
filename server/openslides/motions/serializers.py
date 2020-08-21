import jsonschema
from django.db import transaction

from openslides.poll.serializers import (
    BASE_OPTION_FIELDS,
    BASE_POLL_FIELDS,
    BASE_VOTE_FIELDS,
    BaseOptionSerializer,
    BasePollSerializer,
    BaseVoteSerializer,
)

from ..core.config import config
from ..utils.auth import get_group_model, has_perm
from ..utils.autoupdate import inform_changed_data
from ..utils.rest_api import (
    BooleanField,
    CharField,
    Field,
    IdPrimaryKeyRelatedField,
    IntegerField,
    JSONField,
    ModelSerializer,
    SerializerMethodField,
    ValidationError,
)
from ..utils.validate import validate_html_strict
from .models import (
    Category,
    Motion,
    MotionBlock,
    MotionChangeRecommendation,
    MotionComment,
    MotionCommentSection,
    MotionOption,
    MotionPoll,
    MotionVote,
    State,
    StatuteParagraph,
    Submitter,
    Workflow,
)


def validate_workflow_field(value):
    """
    Validator to ensure that the workflow with the given id exists.
    """
    if not Workflow.objects.filter(pk=value).exists():
        raise ValidationError(
            {"detail": "Workflow {0} does not exist.", "args": [value]}
        )


class StatuteParagraphSerializer(ModelSerializer):
    """
    Serializer for motion.models.StatuteParagraph objects.
    """

    class Meta:
        model = StatuteParagraph
        fields = ("id", "title", "text", "weight")


class CategorySerializer(ModelSerializer):
    """
    Serializer for motion.models.Category objects.
    """

    class Meta:
        model = Category
        fields = ("id", "name", "prefix", "parent", "weight", "level")
        read_only_fields = ("parent", "weight")


class MotionBlockSerializer(ModelSerializer):
    """
    Serializer for motion.models.Category objects.
    """

    agenda_create = BooleanField(write_only=True, required=False, allow_null=True)
    agenda_type = IntegerField(
        write_only=True, required=False, min_value=1, max_value=3, allow_null=True
    )
    agenda_parent_id = IntegerField(write_only=True, required=False, min_value=1)
    motions_id = SerializerMethodField()

    class Meta:
        model = MotionBlock
        fields = (
            "id",
            "title",
            "agenda_item_id",
            "list_of_speakers_id",
            "agenda_create",
            "agenda_type",
            "agenda_parent_id",
            "internal",
            "motions_id",
        )

    def get_motions_id(self, block):
        return [motion.id for motion in block.motion_set.all()]

    def create(self, validated_data):
        """
        Customized create method. Set information about related agenda item
        into agenda_item_update_information container.
        """
        agenda_create = validated_data.pop("agenda_create", None)
        agenda_type = validated_data.pop("agenda_type", None)
        agenda_parent_id = validated_data.pop("agenda_parent_id", None)
        request_user = validated_data.pop("request_user")  # this should always be there
        motion_block = MotionBlock(**validated_data)
        if has_perm(request_user, "agenda.can_manage"):
            motion_block.agenda_item_update_information["create"] = agenda_create
            motion_block.agenda_item_update_information["type"] = agenda_type
            motion_block.agenda_item_update_information["parent_id"] = agenda_parent_id
        motion_block.save()
        return motion_block


class StateSerializer(ModelSerializer):
    """
    Serializer for motion.models.State objects.
    """

    restriction = JSONField(required=False)

    class Meta:
        model = State
        fields = (
            "id",
            "name",
            "recommendation_label",
            "css_class",
            "restriction",
            "allow_support",
            "allow_create_poll",
            "allow_submitter_edit",
            "dont_set_identifier",
            "show_state_extension_field",
            "merge_amendment_into_final",
            "show_recommendation_extension_field",
            "next_states",
            "workflow",
        )

    def validate_restriction(self, value):
        """
        Ensures that the value is a list and only contains valid values.
        """
        schema = {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "title": "Motion workflow state restriction field schema",
            "description": "An array containing one or more explicit strings to control restriction for motions in this state.",
            "type": "array",
            "items": {
                "type": "string",
                "enum": [
                    "motions.can_see_internal",
                    "motions.can_manage_metadata",
                    "motions.can_manage",
                    "is_submitter",
                ],
            },
        }

        # Validate value.
        try:
            jsonschema.validate(value, schema)
        except jsonschema.ValidationError as err:
            raise ValidationError({"detail": str(err)})
        return value


class WorkflowSerializer(ModelSerializer):
    """
    Serializer for motion.models.Workflow objects.
    """

    # states = StateSerializer(many=True, read_only=True)
    states = IdPrimaryKeyRelatedField(many=True, read_only=True)

    class Meta:
        model = Workflow
        fields = ("id", "name", "states", "first_state")
        read_only_fields = ("first_state",)

    @transaction.atomic
    def create(self, validated_data):
        """
        Customized create method. Creating a new workflow does always create a
        new state which is used as first state.
        """
        workflow = super().create(validated_data)
        first_state = State.objects.create(
            name="new",
            workflow=workflow,
            allow_create_poll=True,
            allow_support=True,
            allow_submitter_edit=True,
        )
        workflow.first_state = first_state
        workflow.save()
        return workflow


class AmendmentParagraphsJSONSerializerField(Field):
    """
    Serializer for motions's amendment_paragraphs JSONField.
    """

    def to_representation(self, obj):
        """
        Returns the value of the field.
        """
        return obj

    def to_internal_value(self, data):
        """
        Checks that data is a list of strings.
        """
        if not isinstance(data, list):
            raise ValidationError({"detail": "Data must be a list."})
        for paragraph in data:
            if not isinstance(paragraph, str) and paragraph is not None:
                raise ValidationError(
                    {"detail": "Paragraph must be either a string or null/None."}
                )
        return data


class MotionVoteSerializer(BaseVoteSerializer):
    class Meta:
        model = MotionVote
        fields = BASE_VOTE_FIELDS
        read_only_fields = BASE_VOTE_FIELDS


class MotionOptionSerializer(BaseOptionSerializer):
    class Meta:
        model = MotionOption
        fields = BASE_OPTION_FIELDS
        read_only_fields = BASE_OPTION_FIELDS


class MotionPollSerializer(BasePollSerializer):
    """
    Serializer for motion.models.MotionPoll objects.
    """

    class Meta:
        model = MotionPoll
        fields = ("motion", "pollmethod") + BASE_POLL_FIELDS
        read_only_fields = ("state",)

    def update(self, instance, validated_data):
        """ Prevent updating the motion """
        validated_data.pop("motion", None)
        return super().update(instance, validated_data)

    def norm_100_percent_base_to_pollmethod(
        self, onehundred_percent_base, pollmethod, old_100_percent_base=None
    ):
        if (
            pollmethod == MotionPoll.POLLMETHOD_YN
            and onehundred_percent_base == MotionPoll.PERCENT_BASE_YNA
        ):
            return MotionPoll.PERCENT_BASE_YN
        return None


class MotionChangeRecommendationSerializer(ModelSerializer):
    """
    Serializer for motion.models.MotionChangeRecommendation objects.
    """

    class Meta:
        model = MotionChangeRecommendation
        fields = (
            "id",
            "motion",
            "rejected",
            "internal",
            "type",
            "other_description",
            "line_from",
            "line_to",
            "text",
            "creation_time",
        )

    def is_title_cr(self, data):
        return int(data["line_from"]) == 0 and int(data["line_to"]) == 0

    def validate(self, data):
        # Change recommendations for titles are stored as plain-text, thus they don't need to be html-escaped
        if "text" in data and not self.is_title_cr(data):
            data["text"] = validate_html_strict(data["text"])
        return data


class MotionCommentSectionSerializer(ModelSerializer):
    """
    Serializer for motion.models.MotionCommentSection objects.
    """

    read_groups = IdPrimaryKeyRelatedField(
        many=True, required=False, queryset=get_group_model().objects.all()
    )

    write_groups = IdPrimaryKeyRelatedField(
        many=True, required=False, queryset=get_group_model().objects.all()
    )

    class Meta:
        model = MotionCommentSection
        fields = ("id", "name", "read_groups", "write_groups", "weight")
        read_only_fields = ("weight",)

    def create(self, validated_data):
        """ Call inform_changed_data on creation, so the cache includes the groups. """
        section = super().create(validated_data)
        inform_changed_data(section)
        return section


class MotionCommentSerializer(ModelSerializer):
    """
    Serializer for motion.models.MotionComment objects.
    """

    read_groups_id = SerializerMethodField()

    class Meta:
        model = MotionComment
        fields = ("id", "comment", "section", "read_groups_id")

    def get_read_groups_id(self, comment):
        return [group.id for group in comment.section.read_groups.all()]


class SubmitterSerializer(ModelSerializer):
    """
    Serializer for motion.models.Submitter objects.
    """

    class Meta:
        model = Submitter
        fields = ("id", "user", "motion", "weight")


class MotionSerializer(ModelSerializer):
    """
    Serializer for motion.models.Motion objects.
    """

    comments = MotionCommentSerializer(many=True, read_only=True)
    modified_final_version = CharField(allow_blank=True, required=False)
    reason = CharField(allow_blank=True, required=False)
    state_restriction = SerializerMethodField()
    text = CharField(allow_blank=True, required=False)  # This will be checked
    # during validation
    title = CharField(max_length=255)
    amendment_paragraphs = AmendmentParagraphsJSONSerializerField(
        required=False, allow_null=True
    )
    workflow_id = IntegerField(
        min_value=1, required=False, validators=[validate_workflow_field]
    )
    agenda_create = BooleanField(write_only=True, required=False, allow_null=True)
    agenda_type = IntegerField(
        write_only=True, required=False, min_value=1, max_value=3, allow_null=True
    )
    agenda_parent_id = IntegerField(write_only=True, required=False, min_value=1)
    submitters = SubmitterSerializer(many=True, read_only=True)
    change_recommendations = IdPrimaryKeyRelatedField(many=True, read_only=True)
    amendments_id = SerializerMethodField()

    class Meta:
        model = Motion
        fields = (
            "id",
            "identifier",
            "title",
            "text",
            "amendment_paragraphs",
            "modified_final_version",
            "reason",
            "parent",
            "category",
            "category_weight",
            "comments",
            "motion_block",
            "origin",
            "submitters",
            "supporters",
            "state",
            "state_extension",
            "state_restriction",
            "statute_paragraph",
            "workflow_id",
            "recommendation",
            "recommendation_extension",
            "tags",
            "attachments",
            "agenda_item_id",
            "list_of_speakers_id",
            "agenda_create",
            "agenda_type",
            "agenda_parent_id",
            "sort_parent",
            "weight",
            "created",
            "last_modified",
            "change_recommendations",
            "amendments_id",
        )
        read_only_fields = (
            "state",
            "recommendation",
            "weight",
            "category_weight",
            "amendments_id",
        )  # Some other fields are also read_only. See definitions above.

    def get_amendments_id(self, motion):
        return [amendment.id for amendment in motion.amendments.all()]

    def validate(self, data):
        if "text" in data:
            data["text"] = validate_html_strict(data["text"])

        if "modified_final_version" in data:
            data["modified_final_version"] = validate_html_strict(
                data["modified_final_version"]
            )

        if "reason" in data:
            data["reason"] = validate_html_strict(data["reason"])

        # The motion text is only needed, if it is not a paragraph based amendment.
        if data.get("amendment_paragraphs") is not None:
            data["amendment_paragraphs"] = list(
                map(
                    lambda entry: validate_html_strict(entry)
                    if isinstance(entry, str)
                    else None,
                    data["amendment_paragraphs"],
                )
            )
            data["text"] = ""
        else:
            if (self.partial and "text" in data and not data["text"]) or (
                not self.partial and not data.get("text")
            ):
                raise ValidationError({"detail": "The text field may not be blank."})
        if config["motions_reason_required"]:
            if (self.partial and "reason" in data and not data["reason"]) or (
                not self.partial and not data.get("reason")
            ):
                raise ValidationError({"detail": "The reason field may not be blank."})

        return data

    @transaction.atomic
    def create(self, validated_data):
        """
        Customized method to create a new motion from some data.

        Set also information about related agenda item into
        agenda_item_update_information container.
        """
        motion = Motion()
        motion.title = validated_data["title"]
        motion.text = validated_data["text"]
        motion.amendment_paragraphs = validated_data.get("amendment_paragraphs")
        motion.modified_final_version = validated_data.get("modified_final_version", "")
        motion.reason = validated_data.get("reason", "")
        motion.identifier = validated_data.get("identifier")
        motion.category = validated_data.get("category")
        motion.motion_block = validated_data.get("motion_block")
        motion.origin = validated_data.get("origin", "")
        motion.parent = validated_data.get("parent")
        motion.statute_paragraph = validated_data.get("statute_paragraph")
        motion.reset_state(validated_data.get("workflow_id"))
        if has_perm(validated_data["request_user"], "agenda.can_manage"):
            motion.agenda_item_update_information["create"] = validated_data.get(
                "agenda_create"
            )
            motion.agenda_item_update_information["type"] = validated_data.get(
                "agenda_type"
            )
            motion.agenda_item_update_information["parent_id"] = validated_data.get(
                "agenda_parent_id"
            )
        motion.save()
        motion.supporters.add(*validated_data.get("supporters", []))
        motion.attachments.add(*validated_data.get("attachments", []))
        motion.tags.add(*validated_data.get("tags", []))

        if motion.parent:
            inform_changed_data(motion.parent)
        if motion.motion_block:
            inform_changed_data(motion.motion_block)

        return motion

    @transaction.atomic
    def update(self, motion, validated_data):
        """
        Customized method to update a motion.
        - If the workflow changes, the state of the motions is resetted to
          the initial state of the new workflow.
        - If the category changes, the category_weight is reset to the default value.
        """
        workflow_id = None
        if "workflow_id" in validated_data:
            workflow_id = validated_data.pop("workflow_id")

        old_category_id = motion.category.pk if motion.category is not None else None
        new_category_id = (
            validated_data["category"].pk
            if validated_data.get("category") is not None
            else None
        )
        old_block = motion.motion_block
        new_block = validated_data.get("motion_block")

        result = super().update(motion, validated_data)

        # Check for changed workflow
        if workflow_id is not None and workflow_id != motion.workflow_id:
            motion.reset_state(workflow_id)
            motion.save(skip_autoupdate=True)

        # Check for changed category
        if old_category_id != new_category_id:
            motion.category_weight = 10000
            motion.save(skip_autoupdate=True)

        inform_changed_data(motion)

        if new_block != old_block:
            if new_block:
                inform_changed_data(new_block)
            if old_block:
                inform_changed_data(old_block)

        return result

    def get_state_restriction(self, motion):
        """
        Returns the restriction of this state. The default is an empty list so everybody
        with permission to see motions can see this motion.
        """
        return motion.state.restriction
