from django.contrib.contenttypes.models import ContentType
from django.db import transaction
from django.utils.translation import ugettext as _

from openslides.agenda.models import Item
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
    votes = ListField(
        child=DictField(
            child=IntegerField(min_value=-2)),
        write_only=True)

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
            'votescast',
            'votes',)
        read_only_fields = ('yesnoabstain',)

    @transaction.atomic
    def update(self, instance, validated_data):
        """
        Customized update method for polls. To update votes use the write
        only field 'votes'.

        Example data for a 'yesnoabstain' poll with two candidates:

            "votes": [{"Yes": 10, "No": 4, "Abstain": -2},
                      {"Yes": -1, "No": 0, "Abstain": -2}]
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
                instance.set_vote_objects_with_values(option, votes[index])

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
    agenda_items = SerializerMethodField()
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
            'tags',
            'agenda_items',)

    def get_agenda_items(self, obj):
        """
        Returns a list of ids of all agenda items that are related to this
        assignment.
        """
        assignment_content_type = ContentType.objects.get_for_model(obj)
        return (item.pk for item in Item.objects.filter(content_type=assignment_content_type, object_id=obj.pk))


class AssignmentShortSerializer(AssignmentFullSerializer):
    """
    Serializer for assignment.models.Assignment objects. Without unpublished poll.
    """
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
            'tags',
            'agenda_items',)
