from django.core.urlresolvers import reverse, NoReverseMatch

from openslides.utils.rest_api import get_collection_and_id_from_url, serializers, root_rest_for

from .models import Item, Speaker


class SpeakerSerializer(serializers.ModelSerializer):
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


class RelatedItemRelatedField(serializers.RelatedField):
    """
    A custom field to use for the content_object generic relationship.
    """
    def to_representation(self, value):
        """
        Returns info concerning the related object extracted from the api URL
        of this object.
        """
        view_name = '%s-detail' % type(value)._meta.object_name.lower()
        try:
            url = reverse(view_name, kwargs={'pk': value.pk})
        except NoReverseMatch:
            collection, obj_id = 'unknown', value.pk
        else:
            collection, obj_id = get_collection_and_id_from_url(url)
        return {'collection': collection, 'id': obj_id}


@root_rest_for(Item)
class ItemSerializer(serializers.ModelSerializer):
    """
    Serializer for agenda.models.Item objects.
    """
    get_title = serializers.CharField(read_only=True)
    get_title_supplement = serializers.CharField(read_only=True)
    content_object = RelatedItemRelatedField(read_only=True)
    item_no = serializers.CharField(read_only=True)
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
            'weight',
            'lft',
            'rght',
            'tree_id',
            'level',
            'parent',
            'tags',)
