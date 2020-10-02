from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import Permission

from ..utils.autoupdate import inform_changed_data
from ..utils.rest_api import (
    IdPrimaryKeyRelatedField,
    JSONField,
    ModelSerializer,
    RelatedField,
    SerializerMethodField,
    ValidationError,
)
from ..utils.validate import validate_html_strict
from .models import Group, PersonalNote, User


USERCANSEESERIALIZER_FIELDS = (
    "id",
    "username",
    "title",
    "first_name",
    "last_name",
    "structure_level",
    "number",
    "about_me",
    "groups",
    "is_present",
    "is_committee",
    "vote_weight",
    "gender",
)


USERCANSEEEXTRASERIALIZER_FIELDS = USERCANSEESERIALIZER_FIELDS + (
    "email",
    "last_email_send",
    "comment",
    "is_active",
    "auth_type",
    "vote_delegated_to_id",
    "vote_delegated_from_users_id",
)


class UserSerializer(ModelSerializer):
    """
    Serializer for users.models.User objects.

    Serializes all relevant fields for manager.
    """

    groups = IdPrimaryKeyRelatedField(
        many=True,
        required=False,
        queryset=Group.objects.exclude(pk=1),
        help_text=(
            "The groups this user belongs to. A user will "
            "get all permissions granted to each of "
            "his/her groups."
        ),
    )

    vote_delegated_from_users_id = SerializerMethodField()

    class Meta:
        model = User
        fields = USERCANSEEEXTRASERIALIZER_FIELDS + (
            "default_password",
            "session_auth_hash",
            "vote_delegated_to",
        )
        read_only_fields = ("last_email_send", "auth_type")

    def validate(self, data):
        """
        Checks if the given data is empty. Generates the
        username if it is empty.
        """

        try:
            action = self.context["view"].action
        except (KeyError, AttributeError):
            action = None

        # Check if we are in Patch context, if not, check if we have the mandatory fields
        if action != "partial_update":
            if not (
                data.get("username") or data.get("first_name") or data.get("last_name")
            ):
                raise ValidationError(
                    {"detail": "Username, given name and surname can not all be empty."}
                )

        # Generate username. But only if it is not set and the serializer is not
        # called in a PATCH context (partial_update).

        if not data.get("username") and action != "partial_update":
            data["username"] = User.objects.generate_username(
                data.get("first_name", ""), data.get("last_name", "")
            )

        # check the about_me html
        if "about_me" in data:
            data["about_me"] = validate_html_strict(data["about_me"])

        return data

    def prepare_password(self, validated_data):
        """
        Sets the default password.
        """
        # Prepare setup password.
        if not validated_data.get("default_password"):
            validated_data["default_password"] = User.objects.make_random_password()
        validated_data["password"] = make_password(validated_data["default_password"])
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

    def get_vote_delegated_from_users_id(self, user):
        # check needed to prevent errors on import since we only give an OrderedDict there
        if hasattr(user, "vote_delegated_from_users"):
            return [delegator.id for delegator in user.vote_delegated_from_users.all()]
        else:
            return []


class PermissionRelatedField(RelatedField):
    """
    A custom field to use for the permission relationship.
    """

    default_error_messages = {
        "incorrect_value": 'Incorrect value "{value}". Expected app_label.codename string.',
        "does_not_exist": 'Invalid permission "{value}". Object does not exist.',
    }

    def to_representation(self, value):
        """
        Returns the permission code string (app_label.codename).
        """
        return ".".join((value.content_type.app_label, value.codename))

    def to_internal_value(self, data):
        """
        Returns the permission object represented by data. The argument data is
        what is sent by the client. This method expects permission code strings
        (app_label.codename) like to_representation() returns.
        """
        try:
            app_label, codename = data.split(".")
        except ValueError:
            self.fail("incorrect_value", value=data)
        try:
            permission = Permission.objects.get(
                content_type__app_label=app_label, codename=codename
            )
        except Permission.DoesNotExist:
            self.fail("does_not_exist", value=data)
        return permission


class GroupSerializer(ModelSerializer):
    """
    Serializer for django.contrib.auth.models.Group objects.
    """

    permissions = PermissionRelatedField(
        many=True, queryset=Permission.objects.all(), required=False
    )

    class Meta:
        model = Group
        fields = ("id", "name", "permissions")

    def update(self, *args, **kwargs):
        """
        Customized update method. We just refresh the instance from the
        database because of an unknown bug in Django REST framework.
        """
        instance = super().update(*args, **kwargs)
        return Group.objects.get(pk=instance.pk)


class PersonalNoteSerializer(ModelSerializer):
    """
    Serializer for users.models.PersonalNote objects.
    """

    notes = JSONField()

    class Meta:
        model = PersonalNote
        fields = ("id", "user", "notes")
        read_only_fields = ("user",)
