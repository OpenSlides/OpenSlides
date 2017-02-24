from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import Permission
from django.utils.translation import ugettext as _
from django.utils.translation import ugettext_lazy

from ..utils.autoupdate import inform_changed_data
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
    'is_present',
    'is_committee',
)


USERCANSEEEXTRASERIALIZER_FIELDS = USERCANSEESERIALIZER_FIELDS + (
    'comment',
    'is_active',
)


class UserFullSerializer(ModelSerializer):
    """
    Serializer for users.models.User objects.

    Serializes all relevant fields for manager.
    """
    groups = IdPrimaryKeyRelatedField(
        many=True,
        required=False,
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
            raise ValidationError({'detail': _('Username, given name and surname can not all be empty.')})

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
        user = super().create(validated_data)
        # TODO: This autoupdate call is redundant (required by issue #2727). See #2736.
        inform_changed_data(user)
        return user


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

    def update(self, *args, **kwargs):
        """
        Customized update method. We just refresh the instance from the
        database because of an unknown bug in Django REST framework.
        """
        instance = super().update(*args, **kwargs)
        return Group.objects.get(pk=instance.pk)
