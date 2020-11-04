from openslides.utils.rest_api import JSONField, ModelSerializer, RelatedField

from .models import Item, ListOfSpeakers, Speaker


class SpeakerSerializer(ModelSerializer):
    """
    Serializer for agenda.models.Speaker objects.
    """

    class Meta:
        model = Speaker
        fields = (
            "id",
            "user",
            "begin_time",
            "end_time",
            "weight",
            "marked",
            "point_of_order",
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
        return {"collection": value.get_collection_string(), "id": value.get_rest_pk()}


class ItemSerializer(ModelSerializer):
    """
    Serializer for agenda.models.Item objects.
    """

    content_object = RelatedItemRelatedField(read_only=True)

    title_information = JSONField(read_only=True)

    class Meta:
        model = Item
        fields = (
            "id",
            "item_number",
            "title_information",
            "comment",
            "closed",
            "type",
            "is_internal",
            "is_hidden",
            "duration",
            "content_object",
            "weight",
            "parent",
            "level",
            "tags",
        )


class ListOfSpeakersSerializer(ModelSerializer):
    """
    Serializer for agenda.models.Item objects.
    """

    content_object = RelatedItemRelatedField(read_only=True)
    speakers = SpeakerSerializer(many=True, read_only=True)

    title_information = JSONField(read_only=True)

    class Meta:
        model = ListOfSpeakers
        fields = ("id", "title_information", "speakers", "closed", "content_object")
        read_only_fields = ("id", "title_information", "speakers", "content_object")
