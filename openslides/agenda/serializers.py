from rest_framework import serializers

from .models import Item, Speaker


class SpeakerSerializer(serializers.HyperlinkedModelSerializer):
    """
    Serializer for a agenda.models.Speaker objects.
    """
    class Meta:
        model = Speaker
        fields = (
            'id',
            'user',
            'begin_time',
            'end_time',
            'weight')


class ItemSerializer(serializers.ModelSerializer):
    """
    Serializer for a agenda.models.Item objects.
    """
    get_title = serializers.CharField(read_only=True)
    get_title_supplement = serializers.CharField(read_only=True)
    item_no = serializers.CharField(read_only=True)
    speaker_set = SpeakerSerializer(many=True, read_only=True)
    # content_object = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Item
        exclude = ('content_type', 'object_id')

    # TODO: Problem: User can always see the time shedule. Filter fields with respect of permission.
