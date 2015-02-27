from django.contrib import messages
from django.contrib.auth import login as auth_login
from django.contrib.auth import logout as auth_logout
from django.contrib.auth.forms import AuthenticationForm, PasswordChangeForm
from django.utils.translation import ugettext as _
from django.utils.translation import activate, ugettext_lazy
from rest_framework import status

from openslides.utils.rest_api import ModelViewSet, Response
from openslides.utils.views import (
    APIView,
    CSVImportView,
    FormView,
    LoginMixin,
    PDFView,
    UpdateView,
)

from .csv_import import import_users
from .forms import UsersettingsForm
from .models import Group, User
from .pdf import users_passwords_to_pdf, users_to_pdf
from .serializers import (
    GroupSerializer,
    UserCreateUpdateSerializer,
    UserFullSerializer,
    UserShortSerializer,
)


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


class UserCSVImportView(CSVImportView):
    """
    Import users via CSV.
    """
    required_permission = 'users.can_manage'
    success_url_name = 'user_list'
    template_name = 'users/user_form_csv_import.html'
    import_function = staticmethod(import_users)


class UserViewSet(ModelViewSet):
    """
    API endpoint to list, retrieve, create, update and delete users.
    """
    queryset = User.objects.all()

    def check_permissions(self, request):
        """
        Calls self.permission_denied() if the requesting user has not the
        permission to see users and in case of create, update or destroy
        requests the permission to see extra user data and to manage users.
        """
        if (not request.user.has_perm('users.can_see_name') or
                (self.action in ('create', 'update', 'destroy') and not
                 (request.user.has_perm('users.can_manage') and
                  request.user.has_perm('users.can_see_extra_data')))):
            self.permission_denied(request)

    def get_serializer_class(self):
        """
        Returns different serializer classes with respect to action and user's
        permissions.
        """
        if self.action in ('create', 'update'):
            serializer_class = UserCreateUpdateSerializer
        elif self.request.user.has_perm('users.can_see_extra_data'):
            serializer_class = UserFullSerializer
        else:
            serializer_class = UserShortSerializer
        return serializer_class


class GroupViewSet(ModelViewSet):
    """
    API endpoint to list, retrieve, create, update and delete groups.
    """
    queryset = Group.objects.all()
    serializer_class = GroupSerializer

    def check_permissions(self, request):
        """
        Calls self.permission_denied() if the requesting user has not the
        permission to see users and in case of create, update or destroy
        requests the permission to see extra user data and to manage users.
        """
        if (not request.user.has_perm('users.can_see_name') or
                (self.action in ('create', 'update', 'destroy') and not
                 (request.user.has_perm('users.can_manage') and
                  request.user.has_perm('users.can_see_extra_data')))):
            self.permission_denied(request)

    def destroy(self, request, *args, **kwargs):
        """
        Protects builtin groups 'Anonymous' (pk=1) and 'Registered' (pk=2)
        from being deleted.
        """
        instance = self.get_object()
        if instance.pk in (1, 2,):
            self.permission_denied(request)
        else:
            self.perform_destroy(instance)
            response = Response(status=status.HTTP_204_NO_CONTENT)
        return response


class UserSettingsView(LoginMixin, UpdateView):
    required_permission = None
    template_name = 'users/settings.html'
    success_url_name = 'user_settings'
    model = User
    form_class = UsersettingsForm
    url_name_args = []

    def get_initial(self):
        initial = super().get_initial()
        initial['language'] = self.request.session.get('django_language', self.request.LANGUAGE_CODE)
        return initial

    def form_valid(self, form):
        self.request.LANGUAGE_CODE = self.request.session['django_language'] = form.cleaned_data['language']
        activate(self.request.LANGUAGE_CODE)
        return super().form_valid(form)

    def get_object(self):
        return self.request.user


class UserPasswordSettingsView(LoginMixin, FormView):
    required_permission = None
    template_name = 'users/password_change.html'
    success_url_name = 'core_dashboard'
    form_class = PasswordChangeForm

    def form_valid(self, form):
        form.save()
        messages.success(self.request, _('Password successfully changed.'))
        return super().form_valid(form)

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs['user'] = self.request.user
        return kwargs


class UserLoginView(APIView):
    """
    Login the user via ajax.
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
    Logout the user via ajax.
    """
    http_method_names = ['post']

    def post(self, *args, **kwargs):
        auth_logout(self.request)
        return super().post(*args, **kwargs)


class WhoAmIView(APIView):
    """
    Returns the user id in the session.
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
