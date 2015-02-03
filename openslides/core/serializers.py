from openslides.utils.rest_api import serializers

from .models import CustomSlide, Tag


class CustomSlideSerializer(serializers.ModelSerializer):
    """
    Serializer for core.models.CustomSlide objects.
    """
    class Meta:
        model = CustomSlide
        fields = ('id', 'title', 'text', 'weight',)


class TagSerializer(serializers.ModelSerializer):
    """
    Serializer for core.models.Tag objects.
    """
    class Meta:
        model = Tag
        fields = ('id', 'name',)
