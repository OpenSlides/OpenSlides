from django.contrib.auth.hashers import make_password
from django.utils.translation import ugettext as _, ugettext_lazy

from ..utils.autoupdate import inform_changed_data
from ..utils.rest_api import (
    IdPrimaryKeyRelatedField,
    JSONField,
    ModelSerializer,
    ValidationError,
)
from .models import Group, PersonalNote, User


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
    'email',
    'last_email_send',
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
        fields = USERCANSEEEXTRASERIALIZER_FIELDS + ('default_password', 'session_auth_hash')
        read_only_fields = ('last_email_send',)

    def validate(self, data):
        """
        Checks if the given data is empty. Generates the
        username if it is empty.
        """

        try:
            action = self.context['view'].action
        except (KeyError, AttributeError):
            action = None

        # Check if we are in Patch context, if not, check if we have the mandatory fields
        if action != 'partial_update':
            if not (data.get('username') or data.get('first_name') or data.get('last_name')):
                raise ValidationError({'detail': _('Username, given name and surname can not all be empty.')})

        # Generate username. But only if it is not set and the serializer is not
        # called in a PATCH context (partial_update).

        if not data.get('username') and action != 'partial_update':
            data['username'] = User.objects.generate_username(
                data.get('first_name', ''),
                data.get('last_name', ''))
        return data

    def prepare_password(self, validated_data):
        """
        Sets the default password.
        """
        # Prepare setup password.
        if not validated_data.get('default_password'):
            validated_data['default_password'] = User.objects.generate_password()
        validated_data['password'] = make_password(validated_data['default_password'])
        return validated_data

    def create(self, validated_data):
        """
        Creates the user.
        """
        # Perform creation in the database and return new user.
        user = super().create(self.prepare_password(validated_data))
        # TODO: This autoupdate call is redundant (required by issue #2727). See #2736.
        inform_changed_data(user)
        return user


class GroupSerializer(ModelSerializer):
    """
    Serializer for django.contrib.auth.models.Group objects.
    """

    class Meta:
        model = Group
        fields = (
            'id',
            'name',
            'permissions',
        )


class PersonalNoteSerializer(ModelSerializer):
    """
    Serializer for users.models.PersonalNote objects.
    """
    notes = JSONField()

    class Meta:
        model = PersonalNote
        fields = ('id', 'user', 'notes', )
        read_only_fields = ('user', )
