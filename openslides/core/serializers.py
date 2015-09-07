from openslides.utils.rest_api import Field, ModelSerializer, ValidationError

from .models import ChatMessage, CustomSlide, Projector, Tag


class JSONSerializerField(Field):
    """
    Serializer for projector's JSONField.
    """
    def to_internal_value(self, data):
        """
        Checks that data is a list of dictionaries. Every dictionary must have
        a key 'name'.
        """
        if type(data) is not list:
            raise ValidationError('Data must be a list of dictionaries.')
        for element in data:
            if type(element) is not dict:
                raise ValidationError('Data must be a list of dictionaries.')
            elif element.get('name') is None:
                raise ValidationError("Every dictionary must have a key 'name'.")
        return data

    def to_representation(self, value):
        return value


class ProjectorSerializer(ModelSerializer):
    """
    Serializer for core.models.Projector objects.
    """

    class Meta:
        model = Projector
        fields = ('id', 'elements', )


class CustomSlideSerializer(ModelSerializer):
    """
    Serializer for core.models.CustomSlide objects.
    """
    class Meta:
        model = CustomSlide
        fields = ('id', 'title', 'text', 'weight', )


class TagSerializer(ModelSerializer):
    """
    Serializer for core.models.Tag objects.
    """
    class Meta:
        model = Tag
        fields = ('id', 'name', )


class ChatMessageSerializer(ModelSerializer):
    """
    Serializer for core.models.ChatMessage objects.
    """
    class Meta:
        model = ChatMessage
        fields = ('id', 'message', 'timestamp', 'user', )
        read_only_fields = ('user', )
