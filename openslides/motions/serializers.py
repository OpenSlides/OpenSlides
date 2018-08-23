from typing import Dict, Optional  # noqa

from django.db import transaction
from django.utils.translation import ugettext as _

from ..poll.serializers import default_votes_validator
from ..utils.rest_api import (
    CharField,
    DecimalField,
    DictField,
    Field,
    IntegerField,
    ModelSerializer,
    PrimaryKeyRelatedField,
    SerializerMethodField,
    ValidationError,
)
from ..utils.validate import validate_html
from .models import (
    Category,
    Motion,
    MotionBlock,
    MotionChangeRecommendation,
    MotionLog,
    MotionPoll,
    MotionVersion,
    State,
    Submitter,
    Workflow,
)


def validate_workflow_field(value):
    """
    Validator to ensure that the workflow with the given id exists.
    """
    if not Workflow.objects.filter(pk=value).exists():
        raise ValidationError({'detail': _('Workflow %(pk)d does not exist.') % {'pk': value}})


class CategorySerializer(ModelSerializer):
    """
    Serializer for motion.models.Category objects.
    """
    class Meta:
        model = Category
        fields = ('id', 'name', 'prefix',)


class MotionBlockSerializer(ModelSerializer):
    """
    Serializer for motion.models.Category objects.
    """
    agenda_type = IntegerField(write_only=True, required=False, min_value=1, max_value=3)
    agenda_parent_id = IntegerField(write_only=True, required=False, min_value=1)

    class Meta:
        model = MotionBlock
        fields = ('id', 'title', 'agenda_item_id', 'agenda_type', 'agenda_parent_id',)

    def create(self, validated_data):
        """
        Customized create method. Set information about related agenda item
        into agenda_item_update_information container.
        """
        agenda_type = validated_data.pop('agenda_type', None)
        agenda_parent_id = validated_data.pop('agenda_parent_id', None)
        motion_block = MotionBlock(**validated_data)
        motion_block.agenda_item_update_information['type'] = agenda_type
        motion_block.agenda_item_update_information['parent_id'] = agenda_parent_id
        motion_block.save()
        return motion_block


class StateSerializer(ModelSerializer):
    """
    Serializer for motion.models.State objects.
    """
    class Meta:
        model = State
        fields = (
            'id',
            'name',
            'action_word',
            'recommendation_label',
            'css_class',
            'required_permission_to_see',
            'allow_support',
            'allow_create_poll',
            'allow_submitter_edit',
            'versioning',
            'leave_old_version_active',
            'dont_set_identifier',
            'show_state_extension_field',
            'show_recommendation_extension_field',
            'next_states',
            'workflow')


class WorkflowSerializer(ModelSerializer):
    """
    Serializer for motion.models.Workflow objects.
    """
    states = StateSerializer(many=True, read_only=True)

    class Meta:
        model = Workflow
        fields = ('id', 'name', 'states', 'first_state',)
        read_only_fields = ('first_state',)

    @transaction.atomic
    def create(self, validated_data):
        """
        Customized create method. Creating a new workflow does always create a
        new state which is used as first state.
        """
        workflow = super().create(validated_data)
        first_state = State.objects.create(
            name='new',
            action_word='new',
            workflow=workflow,
            allow_create_poll=True,
            allow_support=True,
            allow_submitter_edit=True
        )
        workflow.first_state = first_state
        workflow.save()
        return workflow


class MotionCommentsJSONSerializerField(Field):
    """
    Serializer for motions's comments JSONField.
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
        if type(data) is not dict:
            raise ValidationError({'detail': 'Data must be a dict.'})
        for id, comment in data.items():
            try:
                id = int(id)
            except ValueError:
                raise ValidationError({'detail': 'Id must be an int.'})
            if type(comment) is not str:
                raise ValidationError({'detail': 'Comment must be a string.'})
        return data


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
        if type(data) is not list:
            raise ValidationError({'detail': 'Data must be a list.'})
        for paragraph in data:
            if type(paragraph) is not str and paragraph is not None:
                raise ValidationError({'detail': 'Paragraph must be either a string or null/None.'})
        return data


class MotionLogSerializer(ModelSerializer):
    """
    Serializer for motion.models.MotionLog objects.
    """
    message = SerializerMethodField()

    class Meta:
        model = MotionLog
        fields = ('message_list', 'person', 'time', 'message',)

    def get_message(self, obj):
        """
        Concats the message parts to one string. Useful for smart template code.
        """
        return str(obj)


class MotionPollSerializer(ModelSerializer):
    """
    Serializer for motion.models.MotionPoll objects.
    """
    yes = SerializerMethodField()
    no = SerializerMethodField()
    abstain = SerializerMethodField()
    votes = DictField(
        child=DecimalField(max_digits=15, decimal_places=6, min_value=-2, allow_null=True),
        write_only=True)
    has_votes = SerializerMethodField()

    class Meta:
        model = MotionPoll
        fields = (
            'id',
            'motion',
            'yes',
            'no',
            'abstain',
            'votesvalid',
            'votesinvalid',
            'votescast',
            'votes',
            'has_votes')
        validators = (default_votes_validator,)

    def __init__(self, *args, **kwargs):
        # The following dictionary is just a cache for several votes.
        self._votes_dicts = {}  # type: Dict[int, Dict[int, int]]
        return super().__init__(*args, **kwargs)

    def get_yes(self, obj):
        try:
            result = str(self.get_votes_dict(obj)['Yes'])  # type: Optional[str]
        except KeyError:
            result = None
        return result

    def get_no(self, obj):
        try:
            result = str(self.get_votes_dict(obj)['No'])  # type: Optional[str]
        except KeyError:
            result = None
        return result

    def get_abstain(self, obj):
        try:
            result = str(self.get_votes_dict(obj)['Abstain'])  # type: Optional[str]
        except KeyError:
            result = None
        return result

    def get_votes_dict(self, obj):
        try:
            votes_dict = self._votes_dicts[obj.pk]
        except KeyError:
            votes_dict = self._votes_dicts[obj.pk] = {}
            for vote in obj.get_votes():
                votes_dict[vote.value] = vote.weight
        return votes_dict

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

        Example data:

            "votes": {"Yes": 10, "No": 4, "Abstain": -2}
        """
        # Update votes.
        votes = validated_data.get('votes')
        if votes:
            if len(votes) != len(instance.get_vote_values()):
                raise ValidationError({
                    'detail': _('You have to submit data for %d vote values.') % len(instance.get_vote_values())})
            for vote_value, vote_weight in votes.items():
                if vote_value not in instance.get_vote_values():
                    raise ValidationError({
                        'detail': _('Vote value %s is invalid.') % vote_value})
            instance.set_vote_objects_with_values(instance.get_options().get(), votes, skip_autoupdate=True)

        # Update remaining writeable fields.
        instance.votesvalid = validated_data.get('votesvalid', instance.votesvalid)
        instance.votesinvalid = validated_data.get('votesinvalid', instance.votesinvalid)
        instance.votescast = validated_data.get('votescast', instance.votescast)
        instance.save()
        return instance


class MotionVersionSerializer(ModelSerializer):
    amendment_paragraphs = AmendmentParagraphsJSONSerializerField(required=False)

    """
    Serializer for motion.models.MotionVersion objects.
    """
    class Meta:
        model = MotionVersion
        fields = (
            'id',
            'version_number',
            'creation_time',
            'title',
            'text',
            'amendment_paragraphs',
            'modified_final_version',
            'reason',)


class MotionChangeRecommendationSerializer(ModelSerializer):
    """
    Serializer for motion.models.MotionChangeRecommendation objects.
    """
    class Meta:
        model = MotionChangeRecommendation
        fields = (
            'id',
            'motion_version',
            'rejected',
            'type',
            'other_description',
            'line_from',
            'line_to',
            'text',
            'creation_time',)

    def is_title_cr(self, data):
        return int(data['line_from']) == 0 and int(data['line_to']) == 0

    def validate(self, data):
        # Change recommendations for titles are stored as plain-text, thus they don't need to be html-escaped
        if 'text' in data and not self.is_title_cr(data):
            data['text'] = validate_html(data['text'])
        return data


class SubmitterSerializer(ModelSerializer):
    """
    Serializer for motion.models.Submitter objects.
    """
    class Meta:
        model = Submitter
        fields = (
            'id',
            'user',
            'motion',
            'weight',
        )


class MotionSerializer(ModelSerializer):
    """
    Serializer for motion.models.Motion objects.
    """
    active_version = PrimaryKeyRelatedField(read_only=True)
    comments = MotionCommentsJSONSerializerField(required=False)
    log_messages = MotionLogSerializer(many=True, read_only=True)
    polls = MotionPollSerializer(many=True, read_only=True)
    modified_final_version = CharField(allow_blank=True, required=False, write_only=True)
    reason = CharField(allow_blank=True, required=False, write_only=True)
    state_required_permission_to_see = SerializerMethodField()
    text = CharField(write_only=True, allow_blank=True)
    title = CharField(max_length=255, write_only=True)
    amendment_paragraphs = AmendmentParagraphsJSONSerializerField(required=False, write_only=True)
    versions = MotionVersionSerializer(many=True, read_only=True)
    workflow_id = IntegerField(
        min_value=1,
        required=False,
        validators=[validate_workflow_field],
        write_only=True)
    agenda_type = IntegerField(write_only=True, required=False, min_value=1, max_value=3)
    agenda_parent_id = IntegerField(write_only=True, required=False, min_value=1)
    submitters = SubmitterSerializer(many=True, read_only=True)

    class Meta:
        model = Motion
        fields = (
            'id',
            'identifier',
            'title',
            'text',
            'amendment_paragraphs',
            'modified_final_version',
            'reason',
            'versions',
            'active_version',
            'parent',
            'category',
            'motion_block',
            'origin',
            'submitters',
            'supporters',
            'comments',
            'state',
            'state_required_permission_to_see',
            'workflow_id',
            'recommendation',
            'tags',
            'attachments',
            'polls',
            'agenda_item_id',
            'agenda_type',
            'agenda_parent_id',
            'log_messages',)
        read_only_fields = ('state', 'recommendation',)  # Some other fields are also read_only. See definitions above.

    def validate(self, data):
        if 'text'in data:
            data['text'] = validate_html(data['text'])

        if 'modified_final_version' in data:
            data['modified_final_version'] = validate_html(data['modified_final_version'])

        if 'reason' in data:
            data['reason'] = validate_html(data['reason'])

        validated_comments = dict()
        for id, comment in data.get('comments', {}).items():
            validated_comments[id] = validate_html(comment)
        data['comments'] = validated_comments

        if 'amendment_paragraphs' in data:
            data['amendment_paragraphs'] = list(map(lambda entry: validate_html(entry) if type(entry) is str else None,
                                                    data['amendment_paragraphs']))
            data['text'] = ''
        else:
            if 'text' in data and len(data['text']) == 0:
                raise ValidationError({
                    'detail': _('This field may not be blank.')
                })

        return data

    @transaction.atomic
    def create(self, validated_data):
        """
        Customized method to create a new motion from some data.

        Set also information about related agenda item into
        agenda_item_update_information container.
        """
        motion = Motion()
        motion.title = validated_data['title']
        motion.text = validated_data['text']
        motion.amendment_paragraphs = validated_data.get('amendment_paragraphs')
        motion.modified_final_version = validated_data.get('modified_final_version', '')
        motion.reason = validated_data.get('reason', '')
        motion.identifier = validated_data.get('identifier')
        motion.category = validated_data.get('category')
        motion.motion_block = validated_data.get('motion_block')
        motion.origin = validated_data.get('origin', '')
        motion.comments = validated_data.get('comments')
        motion.parent = validated_data.get('parent')
        motion.reset_state(validated_data.get('workflow_id'))
        motion.agenda_item_update_information['type'] = validated_data.get('agenda_type')
        motion.agenda_item_update_information['parent_id'] = validated_data.get('agenda_parent_id')
        motion.save()
        motion.supporters.add(*validated_data.get('supporters', []))
        motion.attachments.add(*validated_data.get('attachments', []))
        motion.tags.add(*validated_data.get('tags', []))
        return motion

    @transaction.atomic
    def update(self, motion, validated_data):
        """
        Customized method to update a motion.
        """
        # Identifier, category, motion_block, origin and comments.
        for key in ('identifier', 'category', 'motion_block', 'origin', 'comments'):
            if key in validated_data.keys():
                setattr(motion, key, validated_data[key])

        # Workflow.
        workflow_id = validated_data.get('workflow_id')
        if workflow_id is not None and workflow_id != motion.workflow:
            motion.reset_state(workflow_id)

        # Decide if a new version is saved to the database.
        if (motion.state.versioning and
                not validated_data.get('disable_versioning', False)):  # TODO
            version = motion.get_new_version()
        else:
            version = motion.get_last_version()

        # Title, text, reason, ...
        for key in ('title', 'text', 'amendment_paragraphs', 'modified_final_version', 'reason'):
            if key in validated_data.keys():
                setattr(version, key, validated_data[key])

        motion.save(use_version=version)

        # Submitters, supporters, attachments and tags
        for key in ('submitters', 'supporters', 'attachments', 'tags'):
            if key in validated_data.keys():
                attr = getattr(motion, key)
                attr.clear()
                attr.add(*validated_data[key])

        return motion

    def get_state_required_permission_to_see(self, motion):
        """
        Returns the permission (as string) that is required for non
        managers that are not submitters to see this motion in this state.

        Hint: Most states have and empty string here so this restriction is
        disabled.
        """
        return motion.state.required_permission_to_see
