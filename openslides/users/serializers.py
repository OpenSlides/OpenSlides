from openslides.utils.rest_api import serializers

from .models import User


class UserShortSerializer(serializers.ModelSerializer):
    """
    Serializer for users.models.User objects.

    Serializes only name fields.
    """
    class Meta:
        model = User
        fields = (
            'url',
            'username',
            'title',
            'first_name',
            'last_name',
            'structure_level')


class UserFullSerializer(serializers.ModelSerializer):
    """
    Serializer for users.models.User objects.

    Serializes all relevant fields.
    """
    class Meta:
        model = User
        fields = (
            'url',
            'is_present',
            'username',
            'title',
            'first_name',
            'last_name',
            'structure_level',
            'about_me',
            'comment',
            'default_password',
            'is_active')
