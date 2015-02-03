from openslides.utils.rest_api import serializers

from .models import Group, User  # TODO: Don't import Group from models but from core.models.


class UserShortSerializer(serializers.ModelSerializer):
    """
    Serializer for users.models.User objects.

    Serializes only name fields.
    """
    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'title',
            'first_name',
            'last_name',
            'structure_level',
            'groups',)


class UserFullSerializer(serializers.ModelSerializer):
    """
    Serializer for users.models.User objects.

    Serializes all relevant fields.
    """
    class Meta:
        model = User
        fields = (
            'id',
            'is_present',
            'username',
            'title',
            'first_name',
            'last_name',
            'structure_level',
            'about_me',
            'comment',
            'groups',
            'default_password',
            'last_login',
            'is_active',)


class GroupSerializer(serializers.ModelSerializer):
    """
    Serializer for django.contrib.auth.models.Group objects.
    """
    class Meta:
        model = Group
        fields = (
            'id',
            'name',
            'permissions',)
