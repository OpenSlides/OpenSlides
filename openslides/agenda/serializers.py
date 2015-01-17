from openslides.utils import rest_api

from .models import Item, Speaker


class SpeakerSerializer(rest_api.serializers.HyperlinkedModelSerializer):
    """
    Serializer for agenda.models.Speaker objects.
    """
    class Meta:
        model = Speaker
        fields = (
            'id',
            'user',
            'begin_time',
            'end_time',
            'weight')


class ItemSerializer(rest_api.serializers.HyperlinkedModelSerializer):
    """
    Serializer for a agenda.models.Item objects.
    """
    get_title = rest_api.serializers.CharField(read_only=True)
    get_title_supplement = rest_api.serializers.CharField(read_only=True)
    item_no = rest_api.serializers.CharField(read_only=True)
    speaker_set = SpeakerSerializer(many=True, read_only=True)
    tags = rest_api.serializers.HyperlinkedRelatedField(many=True, read_only=True, view_name='tag-detail')
    # content_object = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Item
        exclude = ('content_type', 'object_id')
