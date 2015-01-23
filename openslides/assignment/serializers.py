from openslides.utils.rest_api import serializers, root_rest_for

from .models import (
    models,
    Assignment,
    AssignmentCandidate,
    AssignmentOption,
    AssignmentPoll,
    AssignmentVote)


class AssignmentCandidateSerializer(serializers.ModelSerializer):
    """
    Serializer for assignment.models.AssignmentCandidate objects.
    """
    class Meta:
        model = AssignmentCandidate
        fields = (
            'id',
            'person',
            'elected',
            'blocked',)


class AssignmentVoteSerializer(serializers.ModelSerializer):
    """
    Serializer for assignment.models.AssignmentVote objects.
    """
    class Meta:
        model = AssignmentVote
        fields = ('weight', 'value',)


class AssignmentOptionSerializer(serializers.ModelSerializer):
    """
    Serializer for assignment.models.AssignmentOption objects.
    """
    assignmentvote_set = AssignmentVoteSerializer(many=True, read_only=True)

    class Meta:
        model = AssignmentOption
        fields = ('candidate', 'assignmentvote_set',)


class FilterPollListSerializer(serializers.ListSerializer):
    """
    Customized serializer to filter polls (exclude unpublished).
    """
    def to_representation(self, data):
        """
        List of object instances -> List of dicts of primitive datatypes.

        This method is adapted to filter the data and exclude unpublished polls.
        """
        # Dealing with nested relationships, data can be a Manager,
        # so, first get a queryset from the Manager if needed
        iterable = data.filter(published=True) if isinstance(data, models.Manager) else data
        return [self.child.to_representation(item) for item in iterable]


class AssignmentAllPollSerializer(serializers.ModelSerializer):
    """
    Serializer for assignment.models.AssignmentPoll objects.

    Serializes all polls.
    """
    assignmentoption_set = AssignmentOptionSerializer(many=True, read_only=True)

    class Meta:
        model = AssignmentPoll
        fields = (
            'id',
            'yesnoabstain',
            'description',
            'published',
            'assignmentoption_set',
            'votesvalid',
            'votesinvalid',
            'votescast',)


class AssignmentShortPollSerializer(AssignmentAllPollSerializer):
    """
    Serializer for assignment.models.AssignmentPoll objects.

    Serializes only short polls.
    """
    class Meta:
        list_serializer_class = FilterPollListSerializer
        model = AssignmentPoll
        fields = (
            'id',
            'yesnoabstain',
            'description',
            'published',
            'assignmentoption_set',
            'votesvalid',
            'votesinvalid',
            'votescast',)


@root_rest_for(Assignment)
class AssignmentFullSerializer(serializers.ModelSerializer):
    """
    Serializer for assignment.models.Assignment objects. With all polls.
    """
    assignmentcandidate_set = AssignmentCandidateSerializer(many=True, read_only=True)
    poll_set = AssignmentAllPollSerializer(many=True, read_only=True)

    class Meta:
        model = Assignment
        fields = (
            'id',
            'name',
            'description',
            'posts',
            'status',
            'assignmentcandidate_set',
            'poll_description_default',
            'poll_set',
            'tags',)


@root_rest_for(Assignment)
class AssignmentShortSerializer(AssignmentFullSerializer):
    """
    Serializer for assignment.models.Assignment objects. Without unpublished poll.
    """
    poll_set = AssignmentShortPollSerializer(many=True, read_only=True)

    class Meta:
        model = Assignment
        fields = (
            'id',
            'name',
            'description',
            'posts',
            'status',
            'assignmentcandidate_set',
            'poll_description_default',
            'poll_set',
            'tags',)
