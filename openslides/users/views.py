from django.contrib.auth import login as auth_login
from django.contrib.auth import logout as auth_logout
from django.contrib.auth.forms import AuthenticationForm
from django.utils.translation import ugettext as _
from django.utils.translation import ugettext_lazy
from rest_framework import status

from openslides.core.config import config
from openslides.utils.rest_api import ModelViewSet, Response, detail_route
from openslides.utils.views import APIView, PDFView

from .models import Group, User
from .pdf import users_passwords_to_pdf, users_to_pdf
from .serializers import (
    GroupSerializer,
    UserFullSerializer,
    UserShortSerializer,
)


# Viewsets for the REST API

class UserViewSet(ModelViewSet):
    """
    API endpoint for users.

    There are the following views: metadata, list, retrieve, create,
    partial_update, update, destroy and reset_password.
    """
    queryset = User.objects.all()

    def check_view_permissions(self):
        """
        Returns True if the user has required permissions.
        """
        if self.action in ('metadata', 'list', 'retrieve'):
            result = self.request.user.has_perm('users.can_see_name')
        elif self.action in ('create', 'partial_update', 'update', 'destroy', 'reset_password'):
            result = (self.request.user.has_perm('users.can_see_name') and
                      self.request.user.has_perm('users.can_see_extra_data') and
                      self.request.user.has_perm('users.can_manage'))
        else:
            result = False
        return result

    def get_serializer_class(self):
        """
        Returns different serializer classes with respect to action and user's
        permissions.
        """
        if (self.action in ('create', 'partial_update', 'update') or
                self.request.user.has_perm('users.can_see_extra_data')):
            # Return the UserFullSerializer for edit requests or for
            # list/retrieve requests of users with more permissions.
            serializer_class = UserFullSerializer
        else:
            serializer_class = UserShortSerializer
        return serializer_class

    @detail_route(methods=['post'])
    def reset_password(self, request, pk=None):
        """
        View to reset the password (using the default password).
        """
        user = self.get_object()
        user.set_password(user.default_password)
        user.save()
        return Response({'detail': _('Password successfully reset.')})


class GroupViewSet(ModelViewSet):
    """
    API endpoint for groups.

    There are the following views: metadata, list, retrieve, create,
    partial_update, update and destroy.
    """
    queryset = Group.objects.all()
    serializer_class = GroupSerializer

    def check_view_permissions(self):
        """
        Returns True if the user has required permissions.
        """
        if self.action in ('metadata', 'list', 'retrieve'):
            # Every authenticated user can see the metadata and list or
            # retrieve groups. Anonymous users can do so if they are enabled.
            result = self.request.user.is_authenticated() or config['general_system_enable_anonymous']
        elif self.action in ('create', 'partial_update', 'update', 'destroy'):
            # Users with all app permissions can edit groups.
            result = (self.request.user.has_perm('users.can_see_name') and
                      self.request.user.has_perm('users.can_see_extra_data') and
                      self.request.user.has_perm('users.can_manage'))
        else:
            # Deny request in any other case.
            result = False
        return result

    def destroy(self, request, *args, **kwargs):
        """
        Protects builtin groups 'Anonymous' (pk=1) and 'Registered' (pk=2)
        from being deleted.
        """
        instance = self.get_object()
        if instance.pk in (1, 2):
            self.permission_denied(request)
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


# Special API views

class UserLoginView(APIView):
    """
    Login the user via Ajax.
    """
    http_method_names = ['post']

    def post(self, *args, **kwargs):
        form = AuthenticationForm(self.request, data=self.request.data)
        if form.is_valid():
            self.user = form.get_user()
            auth_login(self.request, self.user)
            self.success = True
        else:
            self.success = False
        return super().post(*args, **kwargs)

    def get_context_data(self, **context):
        context['success'] = self.success
        if self.success:
            context['user_id'] = self.user.pk
        return super().get_context_data(**context)


class UserLogoutView(APIView):
    """
    Logout the user via Ajax.
    """
    http_method_names = ['post']

    def post(self, *args, **kwargs):
        auth_logout(self.request)
        return super().post(*args, **kwargs)


class WhoAmIView(APIView):
    """
    Returns the id of the requesting user.
    """
    http_method_names = ['get']

    def get_context_data(self, **context):
        """
        Appends the user id into the context.

        Uses None for the anonymous user.
        """
        return super().get_context_data(
            user_id=self.request.user.pk,
            **context)


# Views to generate PDFs

class UsersListPDF(PDFView):
    """
    Generate the userliste as PDF.
    """
    required_permission = 'users.can_see_extra_data'
    filename = ugettext_lazy("user-list")
    document_title = ugettext_lazy('List of Users')

    def append_to_pdf(self, pdf):
        """
        Append PDF objects.
        """
        users_to_pdf(pdf)


class UsersPasswordsPDF(PDFView):
    """
    Generate the access data welcome paper for all users as PDF.
    """
    required_permission = 'users.can_manage'
    filename = ugettext_lazy("User-access-data")
    top_space = 0

    def build_document(self, pdf_document, story):
        pdf_document.build(story)

    def append_to_pdf(self, pdf):
        """
        Append PDF objects.
        """
        users_passwords_to_pdf(pdf)
