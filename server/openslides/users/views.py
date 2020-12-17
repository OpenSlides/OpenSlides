import smtplib
import textwrap
from typing import Iterable, List, Set, Union

from asgiref.sync import async_to_sync
from django.conf import settings
from django.contrib.auth import (
    login as auth_login,
    logout as auth_logout,
    update_session_auth_hash,
)
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.models import Permission
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.contrib.sites.shortcuts import get_current_site
from django.core import mail
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.db.utils import IntegrityError
from django.http.request import QueryDict
from django.utils.encoding import force_bytes, force_text
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode

from openslides.saml import SAML_ENABLED
from openslides.utils import logging

from ..core.config import config
from ..core.signals import permission_change
from ..utils.auth import (
    GROUP_ADMIN_PK,
    GROUP_DEFAULT_PK,
    anonymous_is_enabled,
    has_perm,
)
from ..utils.autoupdate import AutoupdateElement, inform_changed_data, inform_elements
from ..utils.cache import element_cache
from ..utils.rest_api import (
    APIException,
    ModelViewSet,
    Response,
    SimpleMetadata,
    ValidationError,
    detail_route,
    list_route,
    status,
)
from ..utils.validate import validate_json
from ..utils.views import APIView
from .access_permissions import (
    GroupAccessPermissions,
    PersonalNoteAccessPermissions,
    UserAccessPermissions,
)
from .models import Group, PersonalNote, User
from .serializers import GroupSerializer, PermissionRelatedField
from .user_backend import user_backend_manager


demo_mode_users = getattr(settings, "DEMO_USERS", None)
is_demo_mode = isinstance(demo_mode_users, list) and len(demo_mode_users) > 0
logger = logging.getLogger(__name__)
if is_demo_mode:
    logger.info("OpenSlides started in demo mode. Some features are unavailable.")


def assertNoDemoAndAdmin(user_ids):
    if isinstance(user_ids, int):
        user_ids = [user_ids]
    if is_demo_mode and any(user_id in demo_mode_users for user_id in user_ids):
        raise ValidationError({"detail": "Not allowed in demo mode"})


def assertNoDemo():
    if is_demo_mode:
        raise ValidationError({"detail": "Not allowed in demo mode"})


class UserViewSet(ModelViewSet):
    """
    API endpoint for users.

    There are the following views: metadata, list, retrieve, create,
    partial_update, update, destroy and reset_password.
    """

    access_permissions = UserAccessPermissions()
    queryset = User.objects.all()

    def check_view_permissions(self):
        """
        Returns True if the user has required permissions.
        """
        if self.action in ("list", "retrieve"):
            result = self.get_access_permissions().check_permissions(self.request.user)
        elif self.action == "metadata":
            result = has_perm(self.request.user, "users.can_see_name")
        elif self.action in ("update", "partial_update"):
            result = self.request.user.is_authenticated
        elif self.action in (
            "create",
            "destroy",
            "reset_password",
            "bulk_generate_passwords",
            "bulk_reset_passwords_to_default",
            "bulk_set_state",
            "bulk_alter_groups",
            "bulk_delete",
            "mass_import",
            "mass_invite_email",
        ):
            result = (
                has_perm(self.request.user, "users.can_see_name")
                and has_perm(self.request.user, "users.can_see_extra_data")
                and has_perm(self.request.user, "users.can_manage")
            )
        else:
            result = False
        return result

    # catch IntegrityError, probably being caused by a race condition
    def perform_create(self, serializer):
        try:
            super().perform_create(serializer)
        except IntegrityError as e:
            raise ValidationError({"detail": str(e)})

    def update(self, request, *args, **kwargs):
        """
        Customized view endpoint to update an user.

        Checks also whether the requesting user can update the user. He
        needs at least the permissions 'users.can_see_name' (see
        self.check_view_permissions()). Also it is evaluated whether he
        wants to update himself or is manager.
        """
        user = self.get_object()
        assertNoDemoAndAdmin(user.id)
        # Check permissions.
        if (
            has_perm(self.request.user, "users.can_see_name")
            and has_perm(request.user, "users.can_see_extra_data")
            and has_perm(request.user, "users.can_manage")
        ):
            # The user has all permissions so he may update every user.
            if request.data.get("is_active") is False and user == request.user:
                # But a user can not deactivate himself.
                raise ValidationError({"detail": "You can not deactivate yourself."})
        else:
            # The user does not have all permissions so he may only update himself.
            if str(request.user.pk) != self.kwargs["pk"]:
                self.permission_denied(request)

            # This is a hack to make request.data mutable. Otherwise fields can not be deleted.
            if isinstance(request.data, QueryDict):
                request.data._mutable = True
            # Remove fields that the user is not allowed to change.
            # The list() is required because we want to use del inside the loop.
            for key in list(request.data.keys()):
                if key not in ("username", "about_me", "email"):
                    del request.data[key]

        user_backend = user_backend_manager.get_backend(user.auth_type)
        if user_backend:
            disallowed_keys = user_backend.get_disallowed_update_keys()
            for key in list(request.data.keys()):
                if key in disallowed_keys:
                    del request.data[key]

        # Hack to make the serializers validation work again if no username, last- or firstname is given:
        if (
            "username" not in request.data
            and "first_name" not in request.data
            and "last_name" not in request.data
        ):
            request.data["username"] = user.username

        # check that no chains are created with vote delegation
        delegate_id = request.data.get("vote_delegated_to_id")
        if delegate_id:
            try:
                delegate = User.objects.get(id=delegate_id)
            except User.DoesNotExist:
                raise ValidationError(
                    {
                        "detail": f"Vote delegation: The user with id {delegate_id} does not exist"
                    }
                )

            self.assert_no_self_delegation(user, [delegate_id])
            self.assert_vote_not_delegated(delegate)
            self.assert_has_no_delegated_votes(user)

            inform_changed_data(delegate)
            if user.vote_delegated_to:
                inform_changed_data(user.vote_delegated_to)

        # handle delegated_from field seperately since its a SerializerMethodField
        new_delegation_ids = request.data.get("vote_delegated_from_users_id")
        if "vote_delegated_from_users_id" in request.data:
            del request.data["vote_delegated_from_users_id"]

        response = super().update(request, *args, **kwargs)

        # after rest of the request succeeded, handle delegation changes
        if new_delegation_ids:
            self.assert_no_self_delegation(user, new_delegation_ids)
            self.assert_vote_not_delegated(user)

            for id in new_delegation_ids:
                delegation_user = User.objects.get(id=id)
                self.assert_has_no_delegated_votes(delegation_user)
                delegation_user.vote_delegated_to = user
                delegation_user.save()

        delegations_to_remove = user.vote_delegated_from_users.exclude(
            id__in=(new_delegation_ids or [])
        )
        for old_delegation_user in delegations_to_remove:
            old_delegation_user.vote_delegated_to = None
            old_delegation_user.save()

        # if only delegated_from was changed, we need an autoupdate for the operator
        if new_delegation_ids or delegations_to_remove:
            inform_changed_data(user)

        return response

    def assert_vote_not_delegated(self, user):
        if user.vote_delegated_to:
            raise ValidationError(
                {
                    "detail": "You cannot delegate a vote to a user who has already delegated his vote."
                }
            )

    def assert_has_no_delegated_votes(self, user):
        if user.vote_delegated_from_users and len(user.vote_delegated_from_users.all()):
            raise ValidationError(
                {
                    "detail": "You cannot delegate a delegation of vote to another user (cascading not allowed)."
                }
            )

    def assert_no_self_delegation(self, user, delegate_ids):
        if user.id in delegate_ids:
            raise ValidationError({"detail": "You cannot delegate a vote to yourself."})

    def destroy(self, request, *args, **kwargs):
        """
        Customized view endpoint to delete an user.

        Ensures that no one can delete himself.
        """
        assertNoDemo()
        instance = self.get_object()
        if instance == self.request.user:
            raise ValidationError({"detail": "You can not delete yourself."})
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @detail_route(methods=["post"])
    def reset_password(self, request, pk=None):
        """
        View to reset the password of the given user (by url) using a provided password.
        Expected data: { pasword: <the new password> }
        """
        user = self.get_object()
        assertNoDemoAndAdmin(user.id)
        if user.auth_type != "default":
            raise ValidationError(
                {
                    "detail": "The user does not have the login information stored in OpenSlides"
                }
            )

        password = request.data.get("password")
        if not isinstance(password, str):
            raise ValidationError({"detail": "Password has to be a string."})

        try:
            validate_password(password, user=request.user)
        except DjangoValidationError as errors:
            raise ValidationError({"detail": " ".join(errors)})
        user.set_password(password)
        user.save()
        return Response({"detail": "Password successfully reset."})

    @list_route(methods=["post"])
    def bulk_generate_passwords(self, request):
        """
        Generates new random passwords for many users. The request user is excluded
        and the default password will be set to the new generated passwords.
        Expected data: { user_ids: <list of ids> }
        """
        assertNoDemo()
        ids = request.data.get("user_ids")
        self.assert_list_of_ints(ids)

        # Exclude the request user
        users = self.bulk_get_users(request, ids)
        for user in users:
            password = User.objects.make_random_password()
            user.set_password(password)
            user.default_password = password
            user.save()
        return Response()

    @list_route(methods=["post"])
    def bulk_reset_passwords_to_default(self, request):
        """
        resets the password of all given users to their default ones. The
        request user is excluded.
        Expected data: { user_ids: <list of ids> }
        """
        assertNoDemo()
        ids = request.data.get("user_ids")
        self.assert_list_of_ints(ids)

        # Exclude the request user
        users = self.bulk_get_users(request, ids)
        # Validate all default passwords
        for user in users:
            try:
                validate_password(user.default_password, user=user)
            except DjangoValidationError as errors:
                errors = " ".join(errors)
                raise ValidationError(
                    {
                        "detail": 'The default password of user "{0}" is not valid: {1}',
                        "args": [user.username, str(errors)],
                    }
                )

        # Reset passwords
        for user in users:
            user.set_password(user.default_password)
            user.save()
        return Response()

    @list_route(methods=["post"])
    def bulk_set_state(self, request):
        """
        Sets the "state" of may users. The "state" means boolean attributes like active
        or committee of a user. If 'is_active' is choosen, the request user will be
        removed from the list of user ids. Expected data:

        {
          user_ids: <list of ids>
          field: 'is_active' | 'is_present' | 'is_committee'
          value: True|False
        }

        Is_active and is_committee will not be settable for non-default auth type users.
        """
        ids = request.data.get("user_ids")
        self.assert_list_of_ints(ids)
        assertNoDemoAndAdmin(ids)

        field = request.data.get("field")
        if field not in ("is_active", "is_present", "is_committee"):
            raise ValidationError({"detail": "Unsupported field"})
        value = request.data.get("value")
        if not isinstance(value, bool):
            raise ValidationError({"detail": "value must be true or false"})

        users = User.objects.filter(pk__in=ids)
        if field != "is_present":
            users = users.filter(auth_type="default")
        if field == "is_active":
            users = users.exclude(pk=request.user.id)

        for user in users:
            setattr(user, field, value)
            user.save()

        return Response()

    @list_route(methods=["post"])
    def bulk_alter_groups(self, request):
        """
        Adds or removes groups from given users. The request user is excluded.
        Expected data:
        {
            user_ids: <list of ids>,
            action: "add" | "remove",
            group_ids: <list of ids>
        }
        """
        user_ids = request.data.get("user_ids")
        self.assert_list_of_ints(user_ids)
        assertNoDemoAndAdmin(user_ids)
        group_ids = request.data.get("group_ids")
        self.assert_list_of_ints(group_ids, ids_name="groups_id")

        action = request.data.get("action")
        if action not in ("add", "remove"):
            raise ValidationError({"detail": "The action must be add or remove"})

        users = self.bulk_get_users(request, user_ids, auth_type=None)
        groups = list(Group.objects.filter(pk__in=group_ids))

        for user in users:
            if action == "add":
                user.groups.add(*groups)
            else:
                user.groups.remove(*groups)

        inform_changed_data(users)
        return Response()

    @list_route(methods=["post"])
    def bulk_delete(self, request):
        """
        Deletes many users. The request user will be excluded. Expected data:
        { user_ids: <list of ids> }
        """
        assertNoDemo()
        ids = request.data.get("user_ids")
        self.assert_list_of_ints(ids)

        # Exclude the request user
        users = self.bulk_get_users(request, ids, auth_type=None)
        for user in list(users):
            user.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)

    def bulk_get_users(self, request, ids, auth_type="default"):
        """
        Get all users for the given ids. Exludes the request user.
        If the auth type is given (so it is not None), only these users are included.
        """
        queryset = User.objects
        if auth_type is not None:
            queryset = queryset.filter(auth_type=auth_type)
        return queryset.exclude(pk=request.user.id).filter(pk__in=ids)

    @list_route(methods=["post"])
    @transaction.atomic
    def mass_import(self, request):
        """
        API endpoint to create multiple users at once.

        Example: {"users": [{"first_name": "Max"}, {"first_name": "Maxi"}]}
        """
        users = request.data.get("users")
        if not isinstance(users, list):
            raise ValidationError({"detail": "Users has to be a list."})

        created_users = []
        # List of all track ids of all imported users. The track ids are just used in the client.
        imported_track_ids = []
        errors = {}  # maps imported track ids to errors

        for user in users:
            serializer = self.get_serializer(data=user)
            try:
                serializer.is_valid(raise_exception=True)
            except ValidationError as e:
                # Skip invalid users.
                if "vote_weight" in e.detail and "importTrackId" in user:
                    errors[user["importTrackId"]] = "vote_weight"
                continue
            data = serializer.prepare_password(serializer.data)
            groups = data["groups_id"]
            del data["groups_id"]
            del data["vote_delegated_from_users_id"]

            db_user = User(**data)
            try:
                db_user.save(skip_autoupdate=True)
            except IntegrityError:
                # race condition may happen, so skip double users here again
                continue
            db_user.groups.add(*groups)
            created_users.append(db_user)
            if "importTrackId" in user:
                imported_track_ids.append(user["importTrackId"])

        # Now inform all clients and send a response
        inform_changed_data(created_users)
        return Response(
            {
                "detail": "{0} users successfully imported.",
                "errors": errors,
                "args": [len(created_users)],
                "importedTrackIds": imported_track_ids,
            }
        )

    @list_route(methods=["post"])
    def mass_invite_email(self, request):
        """
        Endpoint to send invitation emails to all given users (by id). Returns the
        number of emails send.
        """
        assertNoDemo()
        user_ids = request.data.get("user_ids")
        self.assert_list_of_ints(user_ids)
        # Get subject and body from the response. Do not use the config values
        # because they might not be translated.
        subject = request.data.get("subject")
        message = request.data.get("message")
        if not isinstance(subject, str):
            raise ValidationError({"detail": "Subject has to be a string."})
        if not isinstance(message, str):
            raise ValidationError({"detail": "Message has to be a string."})
        users = User.objects.filter(pk__in=user_ids)

        # Sending Emails. Keep track, which users gets an email.
        # First, try to open the connection to the smtp server.
        connection = mail.get_connection(fail_silently=False)
        try:
            connection.open()
        except ConnectionRefusedError:
            raise ValidationError(
                {
                    "detail": "Cannot connect to SMTP server on {0}:{1}",
                    "args": [settings.EMAIL_HOST, settings.EMAIL_PORT],
                }
            )
        except smtplib.SMTPException as err:
            if err.errno and err.strerror:
                detail = f"{err.errno}: {err.strerror}"
            else:
                detail = str(err)
            raise ValidationError({"detail": detail})

        success_users = []
        user_pks_without_email = []
        try:
            for user in users:
                if user.email:
                    if user.send_invitation_email(
                        connection, subject, message, skip_autoupdate=True
                    ):
                        success_users.append(user)
                else:
                    user_pks_without_email.append(user.pk)
        except DjangoValidationError as err:
            raise ValidationError(err.message_dict)

        connection.close()
        inform_changed_data(success_users)
        return Response(
            {"count": len(success_users), "no_email_ids": user_pks_without_email}
        )

    def assert_list_of_ints(self, ids, ids_name="user_ids"):
        """ Asserts, that ids is a list of ints. Raises a ValidationError, if not. """
        if not isinstance(ids, list):
            raise ValidationError({"detail": "{0} must be a list", "args": [ids_name]})
        for id in ids:
            if not isinstance(id, int):
                raise ValidationError({"detail": "Every id must be a int"})


class GroupViewSetMetadata(SimpleMetadata):
    """
    Customized metadata class for OPTIONS requests.
    """

    def get_field_info(self, field):
        """
        Customized method to change the display name of permission choices.
        """
        field_info = super().get_field_info(field)
        if field.field_name == "permissions":
            field_info["choices"] = [
                {
                    "value": choice_value,
                    "display_name": force_text(choice_name, strings_only=True).split(
                        " | "
                    )[2],
                }
                for choice_value, choice_name in field.choices.items()
            ]
        return field_info


class GroupViewSet(ModelViewSet):
    """
    API endpoint for groups.

    There are the following views: metadata, list, retrieve, create,
    partial_update, update and destroy.
    """

    metadata_class = GroupViewSetMetadata
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    access_permissions = GroupAccessPermissions()

    def check_view_permissions(self):
        """
        Returns True if the user has required permissions.
        """
        if self.action in ("list", "retrieve"):
            result = self.get_access_permissions().check_permissions(self.request.user)
        elif self.action == "metadata":
            # Every authenticated user can see the metadata.
            # Anonymous users can do so if they are enabled.
            result = self.request.user.is_authenticated or anonymous_is_enabled()
        elif self.action in (
            "create",
            "partial_update",
            "update",
            "destroy",
            "set_permission",
        ):
            # Users with all app permissions can edit groups.
            result = (
                has_perm(self.request.user, "users.can_see_name")
                and has_perm(self.request.user, "users.can_see_extra_data")
                and has_perm(self.request.user, "users.can_manage")
            )
        else:
            # Deny request in any other case.
            result = False
        return result

    def update(self, request, *args, **kwargs):
        """
        Customized endpoint to update a group. Send the signal
        'permission_change' if group permissions change.
        """
        group = self.get_object()

        # Collect old and new (given) permissions to get the difference.
        old_permissions = list(
            group.permissions.all()
        )  # Force evaluation so the perms don't change anymore.
        permission_names = request.data["permissions"]
        if isinstance(permission_names, str):
            permission_names = [permission_names]
        given_permissions = [
            PermissionRelatedField(read_only=True).to_internal_value(data=perm)
            for perm in permission_names
        ]

        # Run super to update the group.
        response = super().update(request, *args, **kwargs)

        # Check status code and send 'permission_change' signal.
        if response.status_code == 200:
            changed_permissions = list(
                set(old_permissions).symmetric_difference(set(given_permissions))
            )
            self.inform_permission_change(group, changed_permissions)

        return response

    def destroy(self, request, *args, **kwargs):
        """
        Protects builtin groups 'Default' (pk=1) and 'Admin' (pk=2) from being deleted.
        """
        instance = self.get_object()
        if instance.pk in (GROUP_DEFAULT_PK, GROUP_ADMIN_PK):
            self.permission_denied(request)
        # The list() is required to evaluate the query
        affected_users_ids = list(instance.user_set.values_list("pk", flat=True))

        # Delete the group
        self.perform_destroy(instance)
        config.remove_group_id_from_all_group_configs(instance.id)

        # Get the updated user data from the DB.
        affected_users = User.objects.filter(pk__in=affected_users_ids)
        inform_changed_data(affected_users)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @detail_route(methods=["post"])
    @transaction.atomic
    def set_permission(self, request, *args, **kwargs):
        """
        Send {perm: <permissionstring>, set: <True/False>} to set or
        remove the permission from a group
        """
        perm = request.data.get("perm")
        if not isinstance(perm, str):
            raise ValidationError("You have to give a permission as string.")
        set = request.data.get("set")
        if not isinstance(set, bool):
            raise ValidationError("You have to give a set value.")

        # check if perm is a valid permission
        try:
            app_label, codename = perm.split(".")
        except ValueError:
            raise ValidationError("Incorrect permission string")
        try:
            permission = Permission.objects.get(
                content_type__app_label=app_label, codename=codename
            )
        except Permission.DoesNotExist:
            raise ValidationError("Incorrect permission string")

        # add/remove the permission
        group = self.get_object()
        if set:
            group.permissions.add(permission)
        else:
            group.permissions.remove(permission)
        self.inform_permission_change(group, permission)
        inform_changed_data(group)

        return Response(
            {
                "detail": "Permissions of group {0} successfully changed.",
                "args": [group.pk],
            }
        )

    def inform_permission_change(
        self,
        group: Group,
        changed_permissions: Union[None, Permission, Iterable[Permission]],
    ) -> None:
        """
        Updates every users, if some permission changes. For this, every affected collection
        is fetched via the permission_change signal and every object of the collection passed
        into the cache/autoupdate system.
        """
        if isinstance(changed_permissions, Permission):
            changed_permissions = [changed_permissions]

        if not changed_permissions:
            return  # either None or empty list.

        elements: List[AutoupdateElement] = []
        signal_results = permission_change.send(None, permissions=changed_permissions)
        all_full_data = async_to_sync(element_cache.get_all_data_list)()
        for _, signal_collections in signal_results:
            for cachable in signal_collections:
                for full_data in all_full_data.get(
                    cachable.get_collection_string(), {}
                ):
                    elements.append(
                        AutoupdateElement(
                            id=full_data["id"],
                            collection_string=cachable.get_collection_string(),
                            full_data=full_data,
                            disable_history=True,
                        )
                    )
        inform_elements(elements)


class PersonalNoteViewSet(ModelViewSet):
    """
    API endpoint for personal notes.

    There are the following views: metadata, list, retrieve, create,
    partial_update, update, and destroy.
    """

    access_permissions = PersonalNoteAccessPermissions()
    queryset = PersonalNote.objects.all()

    def check_view_permissions(self):
        """
        Returns True if the user has required permissions.
        """
        if self.action in ("list", "retrieve"):
            result = self.get_access_permissions().check_permissions(self.request.user)
        elif self.action in ("create_or_update", "destroy"):
            # Every authenticated user can see metadata and create personal
            # notes for himself and can manipulate only his own personal notes.
            # See self.perform_create(), self.update() and self.destroy().
            result = self.request.user.is_authenticated
        else:
            result = False
        return result

    @list_route(methods=["post"])
    @transaction.atomic
    def create_or_update(self, request, *args, **kwargs):
        """
        Customized method to ensure that every user can change only his own
        personal notes.

        [{
            collection: <collection>,
            id: <id>,
            content: <Any>,
        }, ...]
        """
        # verify data:
        if not isinstance(request.data, list):
            raise ValidationError({"detail": "Data must be a list"})
        for data in request.data:
            if not isinstance(data, dict):
                raise ValidationError({"detail": "Every entry must be a dict"})
            if not isinstance(data.get("collection"), str):
                raise ValidationError({"detail": "The collection must be a string"})
            if not isinstance(data.get("id"), int):
                raise ValidationError({"detail": "The id must be an integer"})

        # get note
        personal_note, _ = PersonalNote.objects.get_or_create(user=request.user)

        # set defaults
        if not personal_note.notes:
            personal_note.notes = {}

        for data in request.data:
            if data["collection"] not in personal_note.notes:
                personal_note.notes[data["collection"]] = {}
            content = validate_json(data["content"], 2)
            personal_note.notes[data["collection"]][data["id"]] = content

        personal_note.save()
        return Response()

    def destroy(self, request, *args, **kwargs):
        """
        Customized method to ensure that every user can delete only his own
        personal notes.
        """
        if self.get_object().user != self.request.user:
            self.permission_denied(request)
        return super().destroy(request, *args, **kwargs)


# Special API views


class SetPresenceView(APIView):
    http_method_names = ["post"]

    def post(self, request, *args, **kwargs):
        user = request.user
        if not config["users_allow_self_set_present"] or not user.is_authenticated:
            raise ValidationError({"detail": "You cannot set your own presence"})

        present = request.data
        if present not in (True, False):
            raise ValidationError({"detail": "Data must be a boolean"})

        user.is_present = present
        user.save()
        return Response()


class WhoAmIDataView(APIView):
    def get_whoami_data(self):
        """
        Appends the user id to the context. Uses None for the anonymous
        user. Appends also a flag if guest users are enabled in the config.
        Appends also the serialized user if available and auth_type.
        """
        user_id = self.request.user.pk or 0
        guest_enabled = anonymous_is_enabled()

        auth_type = "default"
        if user_id:
            user_full_data = async_to_sync(element_cache.get_element_data)(
                self.request.user.get_collection_string(), user_id
            )
            if user_full_data is None:
                raise APIException(f"Could not find user {user_id}", 500)

            auth_type = user_full_data["auth_type"]
            user_data = async_to_sync(element_cache.restrict_element_data)(
                user_full_data, self.request.user.get_collection_string(), user_id
            )
            group_ids = user_data["groups_id"] or [GROUP_DEFAULT_PK]
        else:
            user_data = None
            group_ids = [GROUP_DEFAULT_PK] if guest_enabled else []

        # collect all permissions
        permissions: Set[str] = set()
        group_all_data = async_to_sync(element_cache.get_collection_data)("users/group")
        for group_id in group_ids:
            permissions.update(group_all_data[group_id]["permissions"])

        return {
            "user_id": user_id or None,
            "guest_enabled": guest_enabled,
            "user": user_data,
            "auth_type": auth_type,
            "permissions": list(permissions),
        }

    def get_context_data(self, **context):
        context.update(self.get_whoami_data())
        return super().get_context_data(**context)


class UserLoginView(WhoAmIDataView):
    """
    Login the user.
    """

    http_method_names = ["get", "post"]

    def post(self, *args, **kwargs):
        # If the client tells that cookies are disabled, do not continue as guest (if enabled)
        if not self.request.data.get("cookies", True):
            raise ValidationError(
                {"detail": "Cookies have to be enabled to use OpenSlides."}
            )
        form = AuthenticationForm(self.request, data=self.request.data)
        if not form.is_valid():
            raise ValidationError({"detail": "Username or password is not correct."})
        self.user = form.get_user()
        if self.user.auth_type != "default":
            raise ValidationError({"detail": "Please login via your identity provider"})
        auth_login(self.request, self.user)
        return super().post(*args, **kwargs)

    def get_context_data(self, **context):
        """
        Adds some context.

        For GET requests adds login info text to context. This info text is
        taken from the config. If this value is empty, a special text is used
        if the admin user has the password 'admin'.

        For POST requests adds the id of the current user to the context.
        """
        if self.request.method == "GET":
            if config["general_login_info_text"]:
                context["login_info_text"] = config["general_login_info_text"]
            else:
                try:
                    user = User.objects.get(username="admin")
                    if user.check_password("admin"):
                        context["login_info_text"] = (
                            "Use <strong>admin</strong> and <strong>admin</strong> for your first login.<br>"
                            "Please change your password to hide this message!"
                        )
                except User.DoesNotExist:
                    pass
            # Add the privacy policy and legal notice, so the client can display it
            # even, it is not logged in.
            context["privacy_policy"] = config["general_event_privacy_policy"]
            context["legal_notice"] = config["general_event_legal_notice"]
            # Add the theme, so the loginpage is themed correctly
            context["theme"] = config["openslides_theme"]
            context["logo_web_header"] = config["logo_web_header"]

            if SAML_ENABLED:
                from openslides.saml.settings import get_saml_settings

                context["saml_settings"] = get_saml_settings().general_settings
        else:
            # self.request.method == 'POST'
            context.update(self.get_whoami_data())
        return super().get_context_data(**context)


class UserLogoutView(WhoAmIDataView):
    """
    Logout the user.
    """

    http_method_names = ["post"]

    def post(self, *args, **kwargs):
        if not self.request.user.is_authenticated:
            raise ValidationError({"detail": "You are not authenticated."})
        auth_logout(self.request)
        return super().post(*args, **kwargs)


class WhoAmIView(WhoAmIDataView):
    """
    Returns the id of the requesting user.
    """

    http_method_names = ["get"]


class SetPasswordView(APIView):
    """
    Users can set a new password for themselves.
    """

    http_method_names = ["post"]

    def post(self, request, *args, **kwargs):
        user = request.user
        if (
            not user.is_authenticated
            or not has_perm(user, "users.can_change_password")
            or user.auth_type != "default"
        ):
            self.permission_denied(request)
        assertNoDemoAndAdmin(user.id)
        if user.check_password(request.data["old_password"]):
            try:
                validate_password(request.data.get("new_password"), user=user)
            except DjangoValidationError as errors:
                raise ValidationError({"detail": " ".join(errors)})
            user.set_password(request.data["new_password"])
            user.save()
            update_session_auth_hash(request, user)
        else:
            raise ValidationError({"detail": "Old password does not match."})
        return super().post(request, *args, **kwargs)


class PasswordResetView(APIView):
    """
    Users can send an email to themselves to get a password reset email.

    Send POST request with {'email': <email addresss>} and all users with this
    address will receive an email (means Django sends one or more emails to
    this address) with a one-use only link.
    """

    http_method_names = ["post"]
    use_https = True  # TODO: get used protocol from server, see issue #4233

    def post(self, request, *args, **kwargs):
        """
        Loop over all users and send emails.
        """
        to_email = request.data.get("email")
        users = self.get_users(to_email)

        if len(users) == 0 and getattr(settings, "RESET_PASSWORD_VERBOSE_ERRORS", True):
            raise ValidationError(
                {"detail": "No users with email {0} found.", "args": [to_email]}
            )

        for user in users:
            current_site = get_current_site(request)
            site_name = current_site.name
            if has_perm(user, "users.can_change_password") or has_perm(
                user, "users.can_manage"
            ):
                context = {
                    "email": to_email,
                    "site_name": site_name,
                    "protocol": "https" if self.use_https else "http",
                    "domain": current_site.domain,
                    "path": "/login/reset-password-confirm/",
                    "user_id": urlsafe_base64_encode(
                        force_bytes(user.pk)
                    ),  # urlsafe_base64_encode decodes to ascii
                    "token": default_token_generator.make_token(user),
                    "username": user.get_username(),
                }
                body = self.get_email_body(**context)
            else:
                # User is not allowed to reset his permission. Send only short message.
                body = f"""
                    You do not have permission to reset your password at {site_name}.

                    Please contact your local administrator.

                    Your username, in case you've forgotten: {user.get_username()}
                    """
            # Send a django.core.mail.EmailMessage to `to_email`.
            subject = f"Password reset for {site_name}"
            subject = "".join(subject.splitlines())
            from_email = None  # TODO: Add nice from_email here.
            email_message = mail.EmailMessage(subject, body, from_email, [to_email])
            try:
                email_message.send()
            except smtplib.SMTPRecipientsRefused:
                raise ValidationError(
                    {
                        "detail": "Error: The email to {0} was refused by the server. Please contact your local administrator.",
                        "args": [to_email],
                    }
                )
            except smtplib.SMTPAuthenticationError as e:
                # Nice error message on auth failure
                raise ValidationError(
                    {
                        "detail": "Error {0}: Authentication failure. Please contact your administrator.",
                        "args": [e.smtp_code],
                    }
                )
            except ConnectionRefusedError:
                raise ValidationError(
                    {
                        "detail": "Connection refused error. Please contact your administrator."
                    }
                )
        return Response()

    def get_users(self, email):
        """Given an email, return matching user(s) who should receive a reset.

        This allows subclasses to more easily customize the default policies
        that prevent inactive users and users with unusable passwords from
        resetting their password.
        """
        active_users = User.objects.filter(
            **{"email__iexact": email, "is_active": True, "auth_type": "default"}
        )
        return [u for u in active_users if u.has_usable_password()]

    def get_email_body(self, **context):
        """
        Add context to email template and return the complete body.
        """
        return textwrap.dedent(
            """
            You're receiving this email because you requested a password reset for your user account at {site_name}.

            Please go to the following page and choose a new password:

            {protocol}://{domain}{path}?user_id={user_id}&token={token}

            Your username, in case you've forgotten: {username}

            Thanks for using our site!

            The {site_name} team.
            """
        ).format(**context)


class PasswordResetConfirmView(APIView):
    """
    View to reset the password.

    Send POST request with {'user_id': <encoded user id>, 'token': <token>,
    'password' <new password>} to set password of this user to the new one.
    """

    http_method_names = ["post"]

    def post(self, request, *args, **kwargs):
        uidb64 = request.data.get("user_id")
        token = request.data.get("token")
        password = request.data.get("password")
        if not (uidb64 and token and password):
            raise ValidationError(
                {"detail": "You have to provide user_id, token and password."}
            )
        user = self.get_user(uidb64)
        if user is None:
            raise ValidationError({"detail": "User does not exist."})
        if not (
            has_perm(user, "users.can_change_password")
            or has_perm(user, "users.can_manage")
        ):
            self.permission_denied(request)
        if not default_token_generator.check_token(user, token):
            raise ValidationError({"detail": "Invalid token."})
        try:
            validate_password(password, user=user)
        except DjangoValidationError as errors:
            raise ValidationError({"detail": " ".join(errors)})
        user.set_password(password)
        user.save()
        return super().post(request, *args, **kwargs)

    def get_user(self, uidb64):
        try:
            # urlsafe_base64_decode() decodes to bytestring
            uid = urlsafe_base64_decode(uidb64).decode()
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None
        return user
