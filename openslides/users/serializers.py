from openslides.utils import rest_api

from .models import User


class UserShortSerializer(rest_api.serializers.ModelSerializer):
    """
    Serializer for a users.models.User objects.
    """
    class Meta:
        model = User
        fields = (
            'username',
            'title',
            'first_name',
            'last_name',
            'structure_level')


class UserFullSerializer(rest_api.serializers.ModelSerializer):
    """
    Serializer for a users.models.User objects.
    """
    class Meta:
        model = User
        fields = (
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
