from openslides.utils.rest_api import serializers

from .models import (
    Category,
    Motion,
    MotionLog,
    MotionOption,
    MotionPoll,
    MotionSubmitter,
    MotionSupporter,
    MotionVersion,
    MotionVote,
    State,
    Workflow,)


class CategorySerializer(serializers.ModelSerializer):
    """
    Serializer for motion.models.Category objects.
    """
    class Meta:
        model = Category
        fields = ('id', 'name', 'prefix',)


class StateSerializer(serializers.ModelSerializer):
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


class WorkflowSerializer(serializers.ModelSerializer):
    """
    Serializer for motion.models.Workflow objects.
    """
    state_set = StateSerializer(many=True, read_only=True)
    first_state = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Workflow
        fields = ('id', 'name', 'state_set', 'first_state',)


class MotionSubmitterSerializer(serializers.ModelSerializer):
    """
    Serializer for motion.models.MotionSubmitter objects.
    """
    class Meta:
        model = MotionSubmitter
        fields = ('person',)  # TODO: Rename this to 'user', see #1348


class MotionSupporterSerializer(serializers.ModelSerializer):
    """
    Serializer for motion.models.MotionSupporter objects.
    """
    class Meta:
        model = MotionSupporter
        fields = ('person',)  # TODO: Rename this to 'user', see #1348


class MotionLogSerializer(serializers.ModelSerializer):
    """
    Serializer for motion.models.MotionLog objects.
    """
    class Meta:
        model = MotionLog
        fields = ('message_list', 'person', 'time',)


class MotionVoteSerializer(serializers.ModelSerializer):
    """
    Serializer for motion.models.MotionVote objects.
    """
    class Meta:
        model = MotionVote
        fields = ('value', 'weight',)


class MotionOptionSerializer(serializers.ModelSerializer):
    """
    Serializer for motion.models.MotionOption objects.
    """
    motionvote_set = MotionVoteSerializer(many=True, read_only=True)

    class Meta:
        model = MotionOption
        fields = ('motionvote_set',)


class MotionPollSerializer(serializers.ModelSerializer):
    """
    Serializer for motion.models.MotionPoll objects.
    """
    motionoption_set = MotionOptionSerializer(many=True, read_only=True)

    class Meta:
        model = MotionPoll
        fields = (
            'poll_number',
            'motionoption_set',
            'votesvalid',
            'votesinvalid',
            'votescast',)


class MotionVersionSerializer(serializers.ModelSerializer):
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


class MotionSerializer(serializers.ModelSerializer):
    """
    Serializer for motion.models.Motion objects.
    """
    versions = MotionVersionSerializer(many=True, read_only=True)
    active_version = serializers.PrimaryKeyRelatedField(read_only=True)
    submitter = MotionSubmitterSerializer(many=True, read_only=True)
    supporter = MotionSupporterSerializer(many=True, read_only=True)
    state = StateSerializer(read_only=True)
    workflow = serializers.SerializerMethodField()
    polls = MotionPollSerializer(many=True, read_only=True)
    log_messages = MotionLogSerializer(many=True, read_only=True)

    class Meta:
        model = Motion
        fields = (
            'id',
            'identifier',
            'identifier_number',
            'parent',
            'category',
            'tags',
            'versions',
            'active_version',
            'submitter',
            'supporter',
            'state',
            'workflow',
            'attachments',
            'polls',
            'log_messages',)

    def get_workflow(self, motion):
        """
        Returns the id of the workflow of the motion.
        """
        return motion.state.workflow.pk
