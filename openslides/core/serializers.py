from openslides.utils.rest_api import serializers

from .models import CustomSlide, Tag


class CustomSlideSerializer(serializers.HyperlinkedModelSerializer):
    """
    Serializer for core.models.CustomSlide objects.
    """
    class Meta:
        model = CustomSlide
        fields = ('url', 'title', 'text', 'weight',)


class TagSerializer(serializers.HyperlinkedModelSerializer):
    """
    Serializer for core.models.Tag objects.
    """
    class Meta:
        model = Tag
        fields = ('url', 'name',)
