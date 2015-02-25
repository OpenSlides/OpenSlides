from django.core.exceptions import ImproperlyConfigured
from django.contrib.auth.hashers import make_password
from django.utils.translation import ugettext as _, ugettext_lazy

from openslides.utils.rest_api import ModelSerializer, PrimaryKeyRelatedField, RelatedField, ValidationError

from .models import Group, Permission, User


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


class UserCreateUpdateSerializer(ModelSerializer):
    """
    Serializer for users.models.User objects.

    Serializes data to create new users or update users.

    Do not use this for list or retrieve requests.
    """
    groups = PrimaryKeyRelatedField(
        many=True,
        queryset=Group.objects.exclude(pk__in=(1, 2)),
        help_text=ugettext_lazy('The groups this user belongs to. A user will '
                                'get all permissions granted to each of '
                                'his/her groups.'))

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
            'is_active',)

    def __init__(self, *args, **kwargs):
        """
        Overridden to add read_only flag to username field in create requests.
        """
        super().__init__(*args, **kwargs)
        if self.context['view'].action == 'create':
            self.fields['username'].read_only = True
        elif self.context['view'].action == 'update':
            # Everything is fine. Do nothing.
            pass
        else:  # Other action than 'create' or 'update'.
            raise ImproperlyConfigured('This serializer can only be used in create and update requests.')

    def validate(self, data):
        """
        Checks that first_name or last_name is given.
        """
        if not (data.get('username') or data.get('first_name') or data.get('last_name')):
            raise ValidationError(_('Username, first name and last name can not all be empty.'))
        return data

    def create(self, validated_data):
        """
        Creates user with generated username and sets the default_password.
        Adds the new user to the registered group.
        """
        # Generate username if neccessary.
        if not validated_data.get('username'):
            validated_data['username'] = User.objects.generate_username(
                validated_data.get('first_name', ''),
                validated_data.get('last_name', ''))
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
            'permissions',)
