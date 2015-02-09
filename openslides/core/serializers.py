from openslides.utils.rest_api import serializers, root_rest_for

from .models import CustomSlide, Tag


@root_rest_for(CustomSlide)
class CustomSlideSerializer(serializers.ModelSerializer):
    """
    Serializer for core.models.CustomSlide objects.
    """
    class Meta:
        model = CustomSlide
        fields = ('id', 'title', 'text', 'weight',)


@root_rest_for(Tag)
class TagSerializer(serializers.ModelSerializer):
    """
    Serializer for core.models.Tag objects.
    """
    class Meta:
        model = Tag
        fields = ('id', 'name',)
