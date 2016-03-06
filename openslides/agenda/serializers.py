from openslides.utils.rest_api import ModelSerializer, RelatedField

from .models import Item, Speaker


class SpeakerSerializer(ModelSerializer):
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
            'weight',
            'item',  # js-data needs the item-id in the nested object to define relations.
        )


class RelatedItemRelatedField(RelatedField):
    """
    A custom field to use for the content_object generic relationship.
    """
    def to_representation(self, value):
        """
        Returns info concerning the related object extracted from the api URL
        of this object.
        """
        return {'collection': value.get_collection_string(), 'id': value.get_rest_pk()}


class ItemSerializer(ModelSerializer):
    """
    Serializer for agenda.models.Item objects.
    """
    content_object = RelatedItemRelatedField(read_only=True)
    speakers = SpeakerSerializer(many=True, read_only=True)

    class Meta:
        model = Item
        fields = (
            'id',
            'item_number',
            'title',
            'list_view_title',
            'comment',
            'closed',
            'type',
            'is_hidden',
            'duration',
            'speakers',
            'speaker_list_closed',
            'content_object',
            'weight',
            'parent',)
