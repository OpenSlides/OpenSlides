from openslides.utils.rest_api import ModelSerializer, RelatedField

from .models import Group, User  # TODO: Don't import Group from models but from core.models.


class UserShortSerializer(ModelSerializer):
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


class UserFullSerializer(ModelSerializer):
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


class PermissionRelatedField(RelatedField):
    """
    A custom field to use for the permission relationship.
    """
    def to_representation(self, value):
        """
        Returns the permission name (app_label.codename).
        """
        return '.'.join((value.content_type.app_label, value.codename,))


class GroupSerializer(ModelSerializer):
    """
    Serializer for django.contrib.auth.models.Group objects.
    """
    permissions = PermissionRelatedField(many=True, read_only=True)

    class Meta:
        model = Group
        fields = (
            'id',
            'name',
            'permissions',)
