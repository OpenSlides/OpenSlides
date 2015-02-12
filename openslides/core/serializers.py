from openslides.utils.rest_api import ModelSerializer

from .models import CustomSlide, Tag


class CustomSlideSerializer(ModelSerializer):
    """
    Serializer for core.models.CustomSlide objects.
    """
    class Meta:
        model = CustomSlide
        fields = ('id', 'title', 'text', 'weight',)


class TagSerializer(ModelSerializer):
    """
    Serializer for core.models.Tag objects.
    """
    class Meta:
        model = Tag
        fields = ('id', 'name',)
