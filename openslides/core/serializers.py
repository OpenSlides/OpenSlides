from rest_framework import serializers

from .models import CustomSlide


class CustomSlideSerializer(serializers.ModelSerializer):
    """
    Serializer for a core.models.CustomSlide objects.
    """
    class Meta:
        model = CustomSlide
