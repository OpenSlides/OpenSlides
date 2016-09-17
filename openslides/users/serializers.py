from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import Permission
from django.utils.translation import ugettext as _
from django.utils.translation import ugettext_lazy

from ..utils.rest_api import (
    IdPrimaryKeyRelatedField,
    ModelSerializer,
    RelatedField,
    ValidationError,
)
from .models import Group, User

USERCANSEESERIALIZER_FIELDS = (
            'id',
            'username',
            'title',
            'first_name',
            'last_name',
            'structure_level',
            'number',
            'about_me',
            'groups',
            'is_committee',
        )


class UserCanSeeSerializer(ModelSerializer):
    """
    Serializer for users.models.User objects to be used by users who have
    only the permission to see users and to change some date of theirselfs.

    Attention: Viewset has to ensure that a user can update only himself.
    """
    class Meta:
        model = User
        fields = USERCANSEESERIALIZER_FIELDS
        read_only_fields = (
            'number',
            'groups',
            'is_comittee',
        )


USERCANSEEEXTRASERIALIZER_FIELDS = (
            'id',
            'is_present',
            'username',
            'title',
            'first_name',
            'last_name',
            'number',
            'structure_level',
            'about_me',
            'comment',
            'groups',
            'is_active',
            'is_committee',
        )


class UserCanSeeExtraSerializer(ModelSerializer):
    """
    Serializer for users.models.User objects to be used by users who have
    the permission to see users with extra data and to change some date of
    theirselfs.

    Attention: Viewset has to ensure that a user can update only himself.
    """
    groups = IdPrimaryKeyRelatedField(
        many=True,
        queryset=Group.objects.exclude(pk=1),
        help_text=ugettext_lazy('The groups this user belongs to. A user will '
                                'get all permissions granted to each of '
                                'his/her groups.'))

    class Meta:
        model = User
        fields = USERCANSEEEXTRASERIALIZER_FIELDS
        read_only_fields = (
            'is_present',
            'number',
            'comment',
            'groups',
            'is_comittee',
            'is_active',
        )


class UserFullSerializer(ModelSerializer):
    """
    Serializer for users.models.User objects.

    Serializes all relevant fields for manager.
    """
    groups = IdPrimaryKeyRelatedField(
        many=True,
        queryset=Group.objects.exclude(pk=1),
        help_text=ugettext_lazy('The groups this user belongs to. A user will '
                                'get all permissions granted to each of '
                                'his/her groups.'))

    class Meta:
        model = User
        fields = USERCANSEEEXTRASERIALIZER_FIELDS + ('default_password',)

    def validate(self, data):
        """
        Checks that first_name or last_name is given. Generates the
        username if it is empty.
        """
        if not (data.get('username') or data.get('first_name') or data.get('last_name')):
            raise ValidationError({'detail': _('Username, first name and last name can not all be empty.')})

        # Generate username. But only if it is not set and the serializer is not
        # called in a PATCH context (partial_update).
        try:
            action = self.context['view'].action
        except (KeyError, AttributeError):
            action = None

        if not data.get('username') and action != 'partial_update':
            data['username'] = User.objects.generate_username(
                data.get('first_name', ''),
                data.get('last_name', ''))
        return data

    def create(self, validated_data):
        """
        Creates the user. Sets the default password.
        """
        # Prepare setup password.
        if not validated_data.get('default_password'):
            validated_data['default_password'] = User.objects.generate_password()
        validated_data['password'] = make_password(validated_data['default_password'], '', 'md5')
        # Perform creation in the database and return new user.
        return super().create(validated_data)


class PermissionRelatedField(RelatedField):
    """
    A custom field to use for the permission relationship.
    """
    default_error_messages = {
        'incorrect_value': ugettext_lazy('Incorrect value "{value}". Expected app_label.codename string.'),
        'does_not_exist': ugettext_lazy('Invalid permission "{value}". Object does not exist.')}

    def to_representation(self, value):
        """
        Returns the permission code string (app_label.codename).
        """
        return '.'.join((value.content_type.app_label, value.codename,))

    def to_internal_value(self, data):
        """
        Returns the permission object represented by data. The argument data is
        what is sent by the client. This method expects permission code strings
        (app_label.codename) like to_representation() returns.
        """
        try:
            app_label, codename = data.split('.')
        except ValueError:
            self.fail('incorrect_value', value=data)
        try:
            permission = Permission.objects.get(content_type__app_label=app_label, codename=codename)
        except Permission.DoesNotExist:
            self.fail('does_not_exist', value=data)
        return permission


class GroupSerializer(ModelSerializer):
    """
    Serializer for django.contrib.auth.models.Group objects.
    """
    permissions = PermissionRelatedField(
        many=True,
        queryset=Permission.objects.all())

    class Meta:
        model = Group
        fields = (
            'id',
            'name',
            'permissions',
        )
