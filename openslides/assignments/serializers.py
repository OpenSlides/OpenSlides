from openslides.utils.rest_api import ListSerializer, ModelSerializer

from .models import (
    models,
    Assignment,
    AssignmentRelatedUser,
    AssignmentOption,
    AssignmentPoll,
    AssignmentVote)


class AssignmentRelatedUserSerializer(ModelSerializer):
    """
    Serializer for assignment.models.AssignmentRelatedUser objects.
    """
    class Meta:
        model = AssignmentRelatedUser
        fields = (
            'id',
            'user',
            'status')


class AssignmentVoteSerializer(ModelSerializer):
    """
    Serializer for assignment.models.AssignmentVote objects.
    """
    class Meta:
        model = AssignmentVote
        fields = ('weight', 'value',)


class AssignmentOptionSerializer(ModelSerializer):
    """
    Serializer for assignment.models.AssignmentOption objects.
    """
    assignmentvote_set = AssignmentVoteSerializer(many=True, read_only=True)

    class Meta:
        model = AssignmentOption
        fields = ('candidate', 'assignmentvote_set',)


class FilterPollListSerializer(ListSerializer):
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


class AssignmentAllPollSerializer(ModelSerializer):
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


class AssignmentFullSerializer(ModelSerializer):
    """
    Serializer for assignment.models.Assignment objects. With all polls.
    """
    assignment_related_users = AssignmentRelatedUserSerializer(many=True, read_only=True)
    polls = AssignmentAllPollSerializer(many=True, read_only=True)

    class Meta:
        model = Assignment
        fields = (
            'id',
            'title',
            'description',
            'open_posts',
            'phase',
            'assignment_related_users',
            'poll_description_default',
            'polls',
            'tags',)


class AssignmentShortSerializer(AssignmentFullSerializer):
    """
    Serializer for assignment.models.Assignment objects. Without unpublished poll.
    """
    assignment_related_users = AssignmentRelatedUserSerializer(many=True, read_only=True)
    polls = AssignmentShortPollSerializer(many=True, read_only=True)

    class Meta:
        model = Assignment
        fields = (
            'id',
            'title',
            'description',
            'open_posts',
            'phase',
            'assignment_related_users',
            'poll_description_default',
            'polls',
            'tags',)
