from django.core.urlresolvers import reverse

from openslides.utils.rest_api import (
    CharField,
    ModelSerializer,
    RelatedField,
    get_collection_and_id_from_url,
)

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
            'weight')


class RelatedItemRelatedField(RelatedField):
    """
    A custom field to use for the content_object generic relationship.
    """
    def to_representation(self, value):
        """
        Returns info concerning the related object extracted from the api URL
        of this object.
        """
        view_name = '%s-detail' % type(value)._meta.object_name.lower()
        url = reverse(view_name, kwargs={'pk': value.pk})
        collection, obj_id = get_collection_and_id_from_url(url)
        return {'collection': collection, 'id': obj_id}


class ItemSerializer(ModelSerializer):
    """
    Serializer for agenda.models.Item objects.
    """
    get_title = CharField(read_only=True)
    get_title_supplement = CharField(read_only=True)
    content_object = RelatedItemRelatedField(read_only=True)
    item_no = CharField(read_only=True)
    speaker_set = SpeakerSerializer(many=True, read_only=True)

    class Meta:
        model = Item
        fields = (
            'id',
            'item_number',
            'item_no',
            'title',
            'get_title',
            'get_title_supplement',
            'text',
            'comment',
            'closed',
            'type',
            'duration',
            'speaker_set',
            'speaker_list_closed',
            'content_object',
            'tags',)
