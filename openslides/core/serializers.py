from openslides.utils import rest_api

from .models import CustomSlide, Tag


class CustomSlideSerializer(rest_api.serializers.HyperlinkedModelSerializer):
    """
    Serializer for core.models.CustomSlide objects.
    """
    class Meta:
        model = CustomSlide


class TagSerializer(rest_api.serializers.HyperlinkedModelSerializer):
    """
    Serializer for core.models.Tag objects.
    """
    class Meta:
        model = Tag
