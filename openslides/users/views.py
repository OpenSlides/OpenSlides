import smtplib
from typing import List  # noqa

from django.conf import settings
from django.contrib.auth import login as auth_login
from django.contrib.auth import logout as auth_logout
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.password_validation import validate_password
from django.core import mail
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.utils.encoding import force_text
from django.utils.translation import ugettext as _

from ..core.config import config
from ..core.signals import permission_change
from ..utils.auth import anonymous_is_enabled, has_perm
from ..utils.autoupdate import (
    inform_changed_data,
    inform_data_collection_element_list,
)
from ..utils.cache import restricted_data_cache
from ..utils.collection import CollectionElement
from ..utils.rest_api import (
    ModelViewSet,
    Response,
    SimpleMetadata,
    ValidationError,
    detail_route,
    list_route,
    status,
)
from ..utils.views import APIView
from .access_permissions import (
    GroupAccessPermissions,
    PersonalNoteAccessPermissions,
    UserAccessPermissions,
)
from .models import Group, PersonalNote, User
from .serializers import GroupSerializer, PermissionRelatedField


# Viewsets for the REST API

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
        if self.action in ('list', 'retrieve'):
            result = self.get_access_permissions().check_permissions(self.request.user)
        elif self.action == 'metadata':
            result = has_perm(self.request.user, 'users.can_see_name')
        elif self.action in ('update', 'partial_update'):
            result = self.request.user.is_authenticated
        elif self.action in ('create', 'destroy', 'reset_password', 'mass_import', 'mass_invite_email'):
            result = (has_perm(self.request.user, 'users.can_see_name') and
                      has_perm(self.request.user, 'users.can_see_extra_data') and
                      has_perm(self.request.user, 'users.can_manage'))
        else:
            result = False
        return result

    def update(self, request, *args, **kwargs):
        """
        Customized view endpoint to update an user.

        Checks also whether the requesting user can update the user. He
        needs at least the permissions 'users.can_see_name' (see
        self.check_view_permissions()). Also it is evaluated whether he
        wants to update himself or is manager.
        """
        user = self.get_object()
        # Check permissions.
        if (has_perm(self.request.user, 'users.can_see_name') and
                has_perm(request.user, 'users.can_see_extra_data') and
                has_perm(request.user, 'users.can_manage')):
            # The user has all permissions so he may update every user.
            if request.data.get('is_active') is False and user == request.user:
                # But a user can not deactivate himself.
                raise ValidationError({'detail': _('You can not deactivate yourself.')})
        else:
            # The user does not have all permissions so he may only update himself.
            if str(request.user.pk) != self.kwargs['pk']:
                self.permission_denied(request)

            # This is a hack to make request.data mutable. Otherwise fields can not be deleted.
            request.data._mutable = True
            # Remove fields that the user is not allowed to change.
            # The list() is required because we want to use del inside the loop.
            for key in list(request.data.keys()):
                if key not in ('username', 'about_me'):
                    del request.data[key]
        response = super().update(request, *args, **kwargs)
        # Maybe some group assignments have changed. Better delete the restricted user cache
        restricted_data_cache.del_user(user.id)
        return response

    def destroy(self, request, *args, **kwargs):
        """
        Customized view endpoint to delete an user.

        Ensures that no one can delete himself.
        """
        instance = self.get_object()
        if instance == self.request.user:
            raise ValidationError({'detail': _('You can not delete yourself.')})
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @detail_route(methods=['post'])
    def reset_password(self, request, pk=None):
        """
        View to reset the password using the requested password.
        """
        user = self.get_object()
        if isinstance(request.data.get('password'), str):
            try:
                validate_password(request.data.get('password'), user=request.user)
            except DjangoValidationError as errors:
                raise ValidationError({'detail': ' '.join(errors)})
            user.set_password(request.data.get('password'))
            user.save()
            return Response({'detail': _('Password successfully reset.')})
        else:
            raise ValidationError({'detail': 'Password has to be a string.'})

    @list_route(methods=['post'])
    @transaction.atomic
    def mass_import(self, request):
        """
        API endpoint to create multiple users at once.

        Example: {"users": [{"first_name": "Max"}, {"first_name": "Maxi"}]}
        """
        users = request.data.get('users')
        if not isinstance(users, list):
            raise ValidationError({'detail': 'Users has to be a list.'})

        created_users = []
        # List of all track ids of all imported users. The track ids are just used in the client.
        imported_track_ids = []

        for user in users:
            serializer = self.get_serializer(data=user)
            try:
                serializer.is_valid(raise_exception=True)
            except ValidationError:
                # Skip invalid users.
                continue
            data = serializer.prepare_password(serializer.data)
            groups = data['groups_id']
            del data['groups_id']

            db_user = User(**data)
            db_user.save(skip_autoupdate=True)
            db_user.groups.add(*groups)
            created_users.append(db_user)
            if 'importTrackId' in user:
                imported_track_ids.append(user['importTrackId'])

        # Now infom all clients and send a response
        inform_changed_data(created_users)
        return Response({
            'detail': _('{number} users successfully imported.').format(number=len(created_users)),
            'importedTrackIds': imported_track_ids})

    @list_route(methods=['post'])
    def mass_invite_email(self, request):
        """
        Endpoint to send invitation emails to all given users (by id). Returns the
        number of emails send.
        """
        user_ids = request.data.get('user_ids')
        if not isinstance(user_ids, list):
            raise ValidationError({'detail': 'User_ids has to be a list.'})
        for user_id in user_ids:
            if not isinstance(user_id, int):
                raise ValidationError({'detail': 'User_id has to be an int.'})
        # Get subject and body from the response. Do not use the config values
        # because they might not be translated.
        subject = request.data.get('subject')
        message = request.data.get('message')
        if not isinstance(subject, str):
            raise ValidationError({'detail': 'Subject has to be a string.'})
        if not isinstance(message, str):
            raise ValidationError({'detail': 'Message has to be a string.'})
        users = User.objects.filter(pk__in=user_ids)

        # Sending Emails. Keep track, which users gets an email.
        # First, try to open the connection to the smtp server.
        connection = mail.get_connection(fail_silently=False)
        try:
            connection.open()
        except ConnectionRefusedError:
            raise ValidationError({'detail': 'Cannot connect to SMTP server on {}:{}'.format(
                settings.EMAIL_HOST,
                settings.EMAIL_PORT)})
        except smtplib.SMTPException as e:
            raise ValidationError({'detail': '{}: {}'.format(e.errno, e.strerror)})

        success_users = []
        user_pks_without_email = []
        try:
            for user in users:
                if user.email:
                    if user.send_invitation_email(connection, subject, message, skip_autoupdate=True):
                        success_users.append(user)
                else:
                    user_pks_without_email.append(user.pk)
        except DjangoValidationError as e:
            raise ValidationError(e.message_dict)

        connection.close()
        inform_changed_data(success_users)
        return Response({
            'count': len(success_users),
            'no_email_ids': user_pks_without_email})


class GroupViewSetMetadata(SimpleMetadata):
    """
    Customized metadata class for OPTIONS requests.
    """
    def get_field_info(self, field):
        """
        Customized method to change the display name of permission choices.
        """
        field_info = super().get_field_info(field)
        if field.field_name == 'permissions':
            field_info['choices'] = [
                {
                    'value': choice_value,
                    'display_name': force_text(choice_name, strings_only=True).split(' | ')[2]
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
        if self.action in ('list', 'retrieve'):
            result = self.get_access_permissions().check_permissions(self.request.user)
        elif self.action == 'metadata':
            # Every authenticated user can see the metadata.
            # Anonymous users can do so if they are enabled.
            result = self.request.user.is_authenticated or anonymous_is_enabled()
        elif self.action in ('create', 'partial_update', 'update', 'destroy'):
            # Users with all app permissions can edit groups.
            result = (has_perm(self.request.user, 'users.can_see_name') and
                      has_perm(self.request.user, 'users.can_see_extra_data') and
                      has_perm(self.request.user, 'users.can_manage'))
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
        old_permissions = list(group.permissions.all())  # Force evaluation so the perms don't change anymore.
        permission_names = request.data['permissions']
        if isinstance(permission_names, str):
            permission_names = [permission_names]
        given_permissions = [
            PermissionRelatedField(read_only=True).to_internal_value(data=perm) for perm in permission_names]

        # Run super to update the group.
        response = super().update(request, *args, **kwargs)

        # Check status code and send 'permission_change' signal.
        if response.status_code == 200:

            # Delete the user chaches of all affected users
            for user in group.user_set.all():
                restricted_data_cache.del_user(user.id)

            def diff(full, part):
                """
                This helper function calculates the difference of two lists:
                The result is a list of all elements of 'full' that are
                not in 'part'.
                """
                part = set(part)
                return [item for item in full if item not in part]

            new_permissions = diff(given_permissions, old_permissions)

            # Some permissions are added.
            if len(new_permissions) > 0:
                collection_elements = []  # type: List[CollectionElement]
                signal_results = permission_change.send(None, permissions=new_permissions, action='added')
                for receiver, signal_collections in signal_results:
                    for collection in signal_collections:
                        collection_elements.extend(collection.element_generator())
                inform_data_collection_element_list(collection_elements)

            # TODO: Some permissions are deleted.

        return response

    def destroy(self, request, *args, **kwargs):
        """
        Protects builtin groups 'Default' (pk=1) from being deleted.
        """
        instance = self.get_object()
        if instance.pk == 1:
            self.permission_denied(request)
        # The list() is required to evaluate the query
        affected_users_ids = list(instance.user_set.values_list('pk', flat=True))

        # Delete the group
        self.perform_destroy(instance)

        # Get the updated user data from the DB.
        affected_users = User.objects.filter(pk__in=affected_users_ids)
        inform_changed_data(affected_users)
        return Response(status=status.HTTP_204_NO_CONTENT)


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
        if self.action in ('list', 'retrieve'):
            result = self.get_access_permissions().check_permissions(self.request.user)
        elif self.action in ('metadata', 'create', 'partial_update', 'update', 'destroy'):
            # Every authenticated user can see metadata and create personal
            # notes for himself and can manipulate only his own personal notes.
            # See self.perform_create(), self.update() and self.destroy().
            result = self.request.user.is_authenticated
        else:
            result = False
        return result

    def perform_create(self, serializer):
        """
        Customized method to inject the request.user into serializer's save
        method so that the request.user can be saved into the model field.
        """
        serializer.save(user=self.request.user)

    def update(self, request, *args, **kwargs):
        """
        Customized method to ensure that every user can change only his own
        personal notes.
        """
        if self.get_object().user != self.request.user:
            self.permission_denied(request)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """
        Customized method to ensure that every user can delete only his own
        personal notes.
        """
        if self.get_object().user != self.request.user:
            self.permission_denied(request)
        return super().destroy(request, *args, **kwargs)


# Special API views

class UserLoginView(APIView):
    """
    Login the user.
    """
    http_method_names = ['get', 'post']

    def post(self, *args, **kwargs):
        # If the client tells that cookies are disabled, do not continue as guest (if enabled)
        if not self.request.data.get('cookies', True):
            raise ValidationError({'detail': _('Cookies have to be enabled to use OpenSlides.')})
        form = AuthenticationForm(self.request, data=self.request.data)
        if not form.is_valid():
            raise ValidationError({'detail': _('Username or password is not correct.')})
        self.user = form.get_user()
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
        if self.request.method == 'GET':
            if config['general_login_info_text']:
                context['info_text'] = config['general_login_info_text']
            else:
                try:
                    user = User.objects.get(username='admin')
                except User.DoesNotExist:
                    context['info_text'] = ''
                else:
                    if user.check_password('admin'):
                        context['info_text'] = _(
                            'Installation was successfully. Use {username} and '
                            '{password} for first login. Important: Please change '
                            'your password!').format(
                                username='<strong>admin</strong>',
                                password='<strong>admin</strong>')
                    else:
                        context['info_text'] = ''
        else:
            # self.request.method == 'POST'
            context['user_id'] = self.user.pk
            user_collection = CollectionElement.from_instance(self.user)
            context['user'] = user_collection.as_dict_for_user(self.user)
        return super().get_context_data(**context)


class UserLogoutView(APIView):
    """
    Logout the user.
    """
    http_method_names = ['post']

    def post(self, *args, **kwargs):
        if not self.request.user.is_authenticated:
            raise ValidationError({'detail': _('You are not authenticated.')})
        auth_logout(self.request)
        return super().post(*args, **kwargs)


class WhoAmIView(APIView):
    """
    Returns the id of the requesting user.
    """
    http_method_names = ['get']

    def get_context_data(self, **context):
        """
        Appends the user id to the context. Uses None for the anonymous
        user. Appends also a flag if guest users are enabled in the config.
        Appends also the serialized user if available.
        """
        user_id = self.request.user.pk
        if user_id is not None:
            user_collection = CollectionElement.from_instance(self.request.user)
            user_data = user_collection.as_dict_for_user(self.request.user)
        else:
            user_data = None
        return super().get_context_data(
            user_id=user_id,
            guest_enabled=anonymous_is_enabled(),
            user=user_data,
            **context)


class SetPasswordView(APIView):
    """
    Users can set a new password for themselves.
    """
    http_method_names = ['post']

    def post(self, request, *args, **kwargs):
        user = request.user
        if user.check_password(request.data['old_password']):
            try:
                validate_password(request.data.get('new_password'), user=user)
            except DjangoValidationError as errors:
                raise ValidationError({'detail': ' '.join(errors)})
            user.set_password(request.data['new_password'])
            user.save()
            update_session_auth_hash(request, user)
        else:
            raise ValidationError({'detail': _('Old password does not match.')})
        return super().post(request, *args, **kwargs)
