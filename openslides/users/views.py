from django.contrib import messages
from django.contrib.auth.forms import PasswordChangeForm
from django.contrib.auth.hashers import make_password
from django.contrib.auth.views import login as django_login
from django.core.urlresolvers import reverse
from django.utils.translation import ugettext as _, ugettext_lazy, activate

from openslides.config.api import config
from openslides.utils.rest_api import ModelViewSet
from openslides.utils.utils import delete_default_permissions, html_strong
from openslides.utils.views import (
    CreateView, CSVImportView, DeleteView, DetailView, FormView, ListView,
    PDFView, PermissionMixin, QuestionView, RedirectView, SingleObjectMixin,
    UpdateView, LoginMixin)
from openslides.utils.exceptions import OpenSlidesError

from .api import gen_password, gen_username, get_protected_perm
from .csv_import import import_users
from .forms import (GroupForm, UserCreateForm, UserMultipleCreateForm,
                    UsersettingsForm, UserUpdateForm)
from .models import Group, User
from .pdf import users_to_pdf, users_passwords_to_pdf
from .serializers import GroupSerializer, UserFullSerializer, UserShortSerializer


class UserListView(ListView):
    """
    Show all users.
    """
    required_permission = 'users.can_see_extra_data'
    context_object_name = 'users'

    def get_queryset(self):
        query = User.objects
        if config['users_sort_users_by_first_name']:
            query = query.order_by('first_name')
        else:
            query = query.order_by('last_name')
        return query.all()

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        all_users = User.objects.count()
        # context vars
        context.update({
            'allusers': all_users,
            'request_user': self.request.user})
        return context


class UserDetailView(DetailView, PermissionMixin):
    """
    Classed based view to show a specific user in the interface.
    """
    required_permission = 'users.can_see_extra_data'
    model = User
    context_object_name = 'shown_user'


class UserCreateView(CreateView):
    """
    Create a new user.
    """
    required_permission = 'users.can_manage'
    model = User
    context_object_name = 'edit_user'
    form_class = UserCreateForm
    success_url_name = 'user_list'
    url_name_args = []

    def manipulate_object(self, form):
        self.object.username = gen_username(
            form.cleaned_data['first_name'], form.cleaned_data['last_name'])

        if not self.object.default_password:
            self.object.default_password = gen_password()

        self.object.set_password(self.object.default_password)

    def post_save(self, form):
        super(UserCreateView, self).post_save(form)
        # TODO: find a better solution that makes the following lines obsolete
        # Background: motion.models.use_post_save adds already the registerd group
        # to new user but super(..).post_save(form) removes it and sets only the
        # groups selected in the form (without 'registered')
        # workaround: add registered group again manually
        from openslides.users.api import get_registered_group  # TODO: Test, if global import is possible
        registered = get_registered_group()
        self.object.groups.add(registered)


class UserMultipleCreateView(FormView):
    """
    View to create multiple users at once using a big text field.

    Sets the password with md5. It is the same password as in the
    default_password field in cleartext. A stronger password hasher is used,
    when the password is changed by the user.
    """
    required_permission = 'users.can_manage'
    template_name = 'users/user_form_multiple.html'
    form_class = UserMultipleCreateForm
    success_url_name = 'user_list'

    def form_valid(self, form):
        # TODO: Use bulk_create
        for number, line in enumerate(form.cleaned_data['users_block'].splitlines()):
            names_list = line.split()
            first_name = ' '.join(names_list[:-1])
            last_name = names_list[-1]
            username = gen_username(first_name, last_name)
            default_password = gen_password()
            User.objects.create(
                username=username,
                first_name=first_name,
                last_name=last_name,
                default_password=default_password,
                password=make_password(default_password, '', 'md5'))
        messages.success(self.request, _('%(number)d users successfully created.') % {'number': number + 1})
        return super(UserMultipleCreateView, self).form_valid(form)


class UserUpdateView(UpdateView):
    """
    Update an existing users.
    """
    required_permission = 'users.can_manage'
    model = User
    context_object_name = 'edit_user'
    form_class = UserUpdateForm
    success_url_name = 'user_list'
    url_name_args = []

    def get_form_kwargs(self, *args, **kwargs):
        form_kwargs = super(UserUpdateView, self).get_form_kwargs(*args, **kwargs)
        form_kwargs.update({'request': self.request})
        return form_kwargs

    def post_save(self, form):
        super(UserUpdateView, self).post_save(form)
        # TODO: Find a better solution that makes the following lines obsolete
        # Background: motion.models.use_post_save adds already the registerd group
        # to new user but super(..).post_save(form) removes it and sets only the
        # groups selected in the form (without 'registered')
        # workaround: add registered group again manually
        from openslides.users.api import get_registered_group  # TODO: Test, if global import is possible
        registered = get_registered_group()
        self.object.groups.add(registered)


class UserDeleteView(DeleteView):
    """
    Delete a user.
    """
    required_permission = 'users.can_manage'
    model = User
    success_url_name = 'user_list'
    url_name_args = []

    def pre_redirect(self, request, *args, **kwargs):
        if self.get_object() == self.request.user:
            messages.error(request, _("You can not delete yourself."))
        else:
            super().pre_redirect(request, *args, **kwargs)

    def pre_post_redirect(self, request, *args, **kwargs):
        if self.get_object() == self.request.user:
            messages.error(self.request, _("You can not delete yourself."))
        else:
            super().pre_post_redirect(request, *args, **kwargs)


class SetUserStatusView(SingleObjectMixin, RedirectView):
    """
    Activate or deactivate an user.
    """
    required_permission = 'users.can_manage'
    allow_ajax = True
    url_name = 'user_list'
    url_name_args = []
    model = User

    def pre_redirect(self, request, *args, **kwargs):
        action = kwargs['action']
        if action == 'activate':
            self.get_object().is_active = True
        elif action == 'deactivate':
            if self.get_object().user == self.request.user:
                messages.error(request, _("You can not deactivate yourself."))
            else:
                self.get_object().is_active = False
        self.get_object().save()
        return super(SetUserStatusView, self).pre_redirect(request, *args, **kwargs)

    def get_ajax_context(self, **kwargs):
        context = super(SetUserStatusView, self).get_ajax_context(**kwargs)
        context['active'] = self.get_object().is_active
        return context


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
    import_function = staticmethod(import_users)
    required_permission = 'users.can_manage'
    success_url_name = 'user_list'
    template_name = 'users/user_form_csv_import.html'


class ResetPasswordView(SingleObjectMixin, QuestionView):
    """
    Set the Passwort for a user to his default password.
    """
    required_permission = 'users.can_manage'
    model = User
    allow_ajax = True
    question_message = ugettext_lazy('Do you really want to reset the password?')

    def get_redirect_url(self, **kwargs):
        return self.get_object().get_absolute_url('update')

    def on_clicked_yes(self):
        self.get_object().reset_password()
        self.get_object().save()

    def get_final_message(self):
        return _('The Password for %s was successfully reset.') % html_strong(self.get_object())


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
        Returns different serializer classes with respect to users permissions.
        """
        if self.request.user.has_perm('users.can_see_extra_data'):
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


class GroupListView(ListView):
    """
    Overview over all groups.
    """
    required_permission = 'users.can_manage'
    template_name = 'users/group_list.html'
    context_object_name = 'groups'
    model = Group


class GroupDetailView(DetailView, PermissionMixin):
    """
    Classed based view to show a specific group in the interface.
    """
    required_permission = 'users.can_manage'
    model = Group
    template_name = 'users/group_detail.html'
    context_object_name = 'group'

    def get_context_data(self, *args, **kwargs):
        context = super(GroupDetailView, self).get_context_data(*args, **kwargs)
        query = User.objects
        if config['users_sort_users_by_first_name']:
            query = query.order_by('first_name')
        else:
            query = query.order_by('last_name')
        context['group_members'] = query.filter(groups__in=[context['group']])
        return context


class GroupCreateView(CreateView):
    """
    Create a new group.
    """
    required_permission = 'users.can_manage'
    template_name = 'users/group_form.html'
    context_object_name = 'group'
    model = Group
    form_class = GroupForm
    success_url_name = 'group_list'
    url_name_args = []

    def get(self, request, *args, **kwargs):
        delete_default_permissions()
        return super(GroupCreateView, self).get(request, *args, **kwargs)

    def get_apply_url(self):
        """
        Returns the url when the user clicks on 'apply'.
        """
        return self.get_url('group_update', args=[self.object.pk])


class GroupUpdateView(UpdateView):
    """
    Update an existing group.
    """
    required_permission = 'users.can_manage'
    template_name = 'users/group_form.html'
    model = Group
    context_object_name = 'group'
    form_class = GroupForm
    url_name_args = []
    success_url_name = 'group_list'

    def get(self, request, *args, **kwargs):
        delete_default_permissions()
        return super().get(request, *args, **kwargs)

    def get_form_kwargs(self, *args, **kwargs):
        form_kwargs = super().get_form_kwargs(*args, **kwargs)
        form_kwargs.update({'request': self.request})
        return form_kwargs

    def get_apply_url(self):
        """
        Returns the url when the user clicks on 'apply'.
        """
        return self.get_url('group_update', args=[self.object.pk])


class GroupDeleteView(DeleteView):
    """
    Delete a group.
    """
    required_permission = 'users.can_manage'
    model = Group
    success_url_name = 'group_list'
    question_url_name = 'group_detail'
    url_name_args = []

    def pre_redirect(self, request, *args, **kwargs):
        if not self.is_protected_from_deleting():
            super().pre_redirect(request, *args, **kwargs)

    def pre_post_redirect(self, request, *args, **kwargs):
        if not self.is_protected_from_deleting():
            super().pre_post_redirect(request, *args, **kwargs)

    def is_protected_from_deleting(self):
        """
        Checks whether the group is protected.
        """
        if self.get_object().pk in [1, 2]:
            messages.error(self.request, _('You can not delete this group.'))
            return True
        if (not self.request.user.is_superuser and
            get_protected_perm() in self.get_object().permissions.all() and
            not Group.objects.exclude(pk=self.get_object().pk).filter(
                permissions__in=[get_protected_perm()],
                user__pk=self.request.user.pk).exists()):
            messages.error(
                self.request,
                _('You can not delete the last group containing the permission '
                  'to manage users you are in.'))
            return True
        return False

    def get_url_name_args(self):
        try:
            answer = self.get_answer()
        except OpenSlidesError:
            answer = 'no'

        if self.request.method == 'POST' and answer != 'no':
            return []
        else:
            return [self.object.pk]


def login(request):
    extra_content = {}
    try:
        admin = User.objects.get(pk=1)
        if admin.check_password(admin.default_password):
            user_data = {
                'user': html_strong(admin.username),
                'password': html_strong(admin.default_password)}

            extra_content['first_time_message'] = _(
                "Installation was successfully! Use %(user)s "
                "(password: %(password)s) for first login.<br>"
                "<strong>Important:</strong> Please change the password after "
                "first login! Otherwise this message still appears for "
                "everyone  and could be a security risk.") % user_data

            extra_content['next'] = reverse('password_change')
    except User.DoesNotExist:
        pass
    return django_login(request, template_name='users/login.html', extra_context=extra_content)


class UserSettingsView(LoginMixin, UpdateView):
    model = User
    form_class = UsersettingsForm
    success_url_name = 'user_settings'
    url_name_args = []
    template_name = 'users/settings.html'

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
    form_class = PasswordChangeForm
    success_url_name = 'core_dashboard'
    template_name = 'users/password_change.html'

    def form_valid(self, form):
        form.save()
        messages.success(self.request, _('Password successfully changed.'))
        return super().form_valid(form)

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs['user'] = self.request.user
        return kwargs
