from django.db import transaction
from django.utils.translation import ugettext as _

from openslides.core.config import config
from openslides.utils.rest_api import (
    CharField,
    DictField,
    IntegerField,
    ModelSerializer,
    PrimaryKeyRelatedField,
    SerializerMethodField,
    ValidationError,
)

from .models import (
    Category,
    Motion,
    MotionLog,
    MotionPoll,
    MotionVersion,
    State,
    Workflow,
)


def validate_workflow_field(value):
    """
    Validator to ensure that the workflow with the given id exists.
    """
    if not Workflow.objects.filter(pk=value).exists():
        raise ValidationError(_('Workflow %(pk)d does not exist.') % {'pk': value})


class CategorySerializer(ModelSerializer):
    """
    Serializer for motion.models.Category objects.
    """
    class Meta:
        model = Category
        fields = ('id', 'name', 'prefix',)


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
            'icon',
            'required_permission_to_see',
            'allow_support',
            'allow_create_poll',
            'allow_submitter_edit',
            'versioning',
            'leave_old_version_active',
            'dont_set_identifier',
            'next_states',)


class WorkflowSerializer(ModelSerializer):
    """
    Serializer for motion.models.Workflow objects.
    """
    state_set = StateSerializer(many=True, read_only=True)
    first_state = PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Workflow
        fields = ('id', 'name', 'state_set', 'first_state',)


class MotionLogSerializer(ModelSerializer):
    """
    Serializer for motion.models.MotionLog objects.
    """
    class Meta:
        model = MotionLog
        fields = ('message_list', 'person', 'time',)


class MotionPollSerializer(ModelSerializer):
    """
    Serializer for motion.models.MotionPoll objects.
    """
    yes = SerializerMethodField()
    no = SerializerMethodField()
    abstain = SerializerMethodField()
    votes = DictField(
        child=IntegerField(min_value=-2),
        write_only=True)

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
            'votes',)

    def get_yes(self, obj):
        try:
            result = obj.get_votes().get(value='Yes').weight
        except obj.get_vote_class().DoesNotExist:
            result = None
        return result

    def get_no(self, obj):
        try:
            result = obj.get_votes().get(value='No').weight
        except obj.get_vote_class().DoesNotExist:
            result = None
        return result

    def get_abstain(self, obj):
        try:
            result = obj.get_votes().get(value='Abstain').weight
        except obj.get_vote_class().DoesNotExist:
            result = None
        return result

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
            instance.set_vote_objects_with_values(instance.get_options().get(), votes)

        # Update remaining writeable fields.
        instance.votesvalid = validated_data.get('votesvalid', instance.votesvalid)
        instance.votesinvalid = validated_data.get('votesinvalid', instance.votesinvalid)
        instance.votescast = validated_data.get('votescast', instance.votescast)
        instance.save()
        return instance


class MotionVersionSerializer(ModelSerializer):
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
            'reason',)


class MotionSerializer(ModelSerializer):
    """
    Serializer for motion.models.Motion objects.
    """
    active_version = PrimaryKeyRelatedField(read_only=True)
    log_messages = MotionLogSerializer(many=True, read_only=True)
    polls = MotionPollSerializer(many=True, read_only=True)
    reason = CharField(allow_blank=True, required=False, write_only=True)
    state = StateSerializer(read_only=True)
    text = CharField(write_only=True)
    title = CharField(max_length=255, write_only=True)
    versions = MotionVersionSerializer(many=True, read_only=True)
    workflow = IntegerField(min_value=1, required=False, validators=[validate_workflow_field])

    class Meta:
        model = Motion
        fields = (
            'id',
            'identifier',
            'title',
            'text',
            'reason',
            'versions',
            'active_version',
            'parent',
            'category',
            'submitters',
            'supporters',
            'state',
            'workflow',
            'tags',
            'attachments',
            'polls',
            'agenda_item_id',
            'log_messages',)
        read_only_fields = ('parent',)  # Some other fields are also read_only. See definitions above.

    @transaction.atomic
    def create(self, validated_data):
        """
        Customized method to create a new motion from some data.
        """
        motion = Motion()
        motion.title = validated_data['title']
        motion.text = validated_data['text']
        motion.reason = validated_data.get('reason', '')
        motion.identifier = validated_data.get('identifier')
        motion.category = validated_data.get('category')
        motion.reset_state(validated_data.get('workflow', int(config['motions_workflow'])))
        motion.save()
        if validated_data.get('submitters'):
            motion.submitters.add(*validated_data['submitters'])
        else:
            motion.submitters.add(validated_data['request_user'])
        motion.supporters.add(*validated_data.get('supporters', []))
        motion.attachments.add(*validated_data.get('attachments', []))
        motion.tags.add(*validated_data.get('tags', []))
        return motion

    @transaction.atomic
    def update(self, motion, validated_data):
        """
        Customized method to update a motion.
        """
        # Identifier and category.
        for key in ('identifier', 'category'):
            if key in validated_data.keys():
                setattr(motion, key, validated_data[key])

        # Workflow.
        workflow = validated_data.get('workflow')
        if workflow is not None and workflow != motion.workflow:
            motion.reset_state(workflow)

        # Decide if a new version is saved to the database.
        if (motion.state.versioning and
                not validated_data.get('disable_versioning', False)):  # TODO
            version = motion.get_new_version()
        else:
            version = motion.get_last_version()

        # Title, text, reason.
        for key in ('title', 'text', 'reason'):
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
