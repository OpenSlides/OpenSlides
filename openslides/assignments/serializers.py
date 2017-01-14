from django.db import transaction
from django.utils.translation import ugettext as _

from openslides.poll.serializers import default_votes_validator
from openslides.utils.rest_api import (
    DictField,
    IntegerField,
    ListField,
    ListSerializer,
    ModelSerializer,
    SerializerMethodField,
    ValidationError,
)

from .models import (
    Assignment,
    AssignmentOption,
    AssignmentPoll,
    AssignmentRelatedUser,
    AssignmentVote,
    models,
)


def posts_validator(data):
    """
    Validator for open posts. It checks that the values for the open posts are greater than 0.
    """
    if (data['open_posts'] and data['open_posts'] is not None and data['open_posts'] < 1):
        raise ValidationError({'detail': _('Value for {} must be greater than 0').format('open_posts')})
    return data


class AssignmentRelatedUserSerializer(ModelSerializer):
    """
    Serializer for assignment.models.AssignmentRelatedUser objects.
    """
    class Meta:
        model = AssignmentRelatedUser
        fields = (
            'id',
            'user',
            'elected',
            'assignment',
            'weight')  # js-data needs the assignment-id in the nested object to define relations.


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
    votes = AssignmentVoteSerializer(many=True, read_only=True)
    is_elected = SerializerMethodField()

    class Meta:
        model = AssignmentOption
        fields = ('id', 'candidate', 'is_elected', 'votes', 'poll', 'weight')

    def get_is_elected(self, obj):
        """
        Returns the election status of the candidate of this option.
        """
        return obj.poll.assignment.is_elected(obj.candidate)


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
    options = AssignmentOptionSerializer(many=True, read_only=True)
    votes = ListField(
        child=DictField(
            child=IntegerField(min_value=-2)),
        write_only=True,
        required=False)
    has_votes = SerializerMethodField()

    class Meta:
        model = AssignmentPoll
        fields = (
            'id',
            'pollmethod',
            'description',
            'published',
            'options',
            'votesvalid',
            'votesinvalid',
            'votescast',
            'votes',
            'has_votes',
            'assignment')  # js-data needs the assignment-id in the nested object to define relations.
        read_only_fields = ('pollmethod',)
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
        votes = validated_data.get('votes')
        if votes:
            options = list(instance.get_options())
            if len(votes) != len(options):
                raise ValidationError({
                    'detail': _('You have to submit data for %d candidates.') % len(options)})
            for index, option in enumerate(options):
                if len(votes[index]) != len(instance.get_vote_values()):
                    raise ValidationError({
                        'detail': _('You have to submit data for %d vote values.') % len(instance.get_vote_values())})
                for vote_value, vote_weight in votes[index].items():
                    if vote_value not in instance.get_vote_values():
                        raise ValidationError({
                            'detail': _('Vote value %s is invalid.') % vote_value})
                instance.set_vote_objects_with_values(option, votes[index], skip_autoupdate=True)

        # Update remaining writeable fields.
        instance.description = validated_data.get('description', instance.description)
        instance.published = validated_data.get('published', instance.published)
        instance.votesvalid = validated_data.get('votesvalid', instance.votesvalid)
        instance.votesinvalid = validated_data.get('votesinvalid', instance.votesinvalid)
        instance.votescast = validated_data.get('votescast', instance.votescast)
        instance.save()
        return instance


class AssignmentShortPollSerializer(AssignmentAllPollSerializer):
    """
    Serializer for assignment.models.AssignmentPoll objects.

    Serializes only short polls (excluded unpublished polls).
    """
    class Meta:
        list_serializer_class = FilterPollListSerializer
        model = AssignmentPoll
        fields = (
            'id',
            'pollmethod',
            'description',
            'published',
            'options',
            'votesvalid',
            'votesinvalid',
            'votescast',
            'has_votes',)


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
            'agenda_item_id',
            'tags',)
        validators = (posts_validator,)


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
            'agenda_item_id',
            'tags',)
        validators = (posts_validator,)
