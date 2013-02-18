#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.participant.views
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Views for the participant app.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from urllib import urlencode
from urlparse import parse_qs

from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, LongTable, Spacer, Table, TableStyle)

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import PasswordChangeForm
from django.contrib.auth.views import login as django_login
from django.core.urlresolvers import reverse
from django.shortcuts import redirect
from django.utils.translation import ugettext as _, ugettext_lazy, activate

from openslides.utils.pdf import stylesheet
from openslides.utils.template import Tab
from openslides.utils.utils import (
    template, decodedict, encodedict, delete_default_permissions, html_strong)
from openslides.utils.views import (
    FormView, PDFView, CreateView, UpdateView, DeleteView, PermissionMixin,
    RedirectView, SingleObjectMixin, ListView, QuestionMixin, DetailView)
from openslides.config.models import config
from openslides.projector.projector import Widget
from openslides.motion.models import Motion
from openslides.assignment.models import Assignment
from openslides.participant.api import gen_username, gen_password, import_users
from openslides.participant.forms import (
    UserCreateForm, UserUpdateForm, UsersettingsForm,
    UserImportForm, GroupForm, ConfigForm)
from openslides.participant.models import User, Group


class UserOverview(ListView):
    """
    Show all participants (users).
    """
    permission_required = 'participant.can_see_participant'
    template_name = 'participant/overview.html'
    context_object_name = 'users'

    def get_queryset(self):
        try:
            sortfilter = encodedict(parse_qs(
                self.request.COOKIES['participant_sortfilter']))
        except KeyError:
            sortfilter = {}

        for value in ['gender', 'structure_level', 'type', 'committee', 'status',
                      'sort', 'reverse']:
            if value in self.request.REQUEST:
                if self.request.REQUEST[value] == '---':
                    try:
                        del sortfilter[value]
                    except KeyError:
                        pass
                else:
                    sortfilter[value] = [self.request.REQUEST[value]]

        query = User.objects
        if 'gender' in sortfilter:
            query = query.filter(gender__iexact=sortfilter['gender'][0])
        if 'structure_level' in sortfilter:
            query = query.filter(structure_level__iexact=sortfilter['structure_level'][0])
        if 'type' in sortfilter:
            query = query.filter(type__iexact=sortfilter['type'][0])
        if 'committee' in sortfilter:
            query = query.filter(committee__iexact=sortfilter['committee'][0])
        if 'status' in sortfilter:
            query = query.filter(is_active=sortfilter['status'][0])
        if 'sort' in sortfilter:
            if sortfilter['sort'][0] in ['first_name', 'last_name', 'last_login']:
                query = query.order_by(sortfilter['sort'][0])
            elif (sortfilter['sort'][0] in
                    ['structure_level', 'type', 'committee', 'comment']):
                query = query.order_by(
                    '%s' % sortfilter['sort'][0])
        else:
            if config['participant_sort_users_by_first_name']:
                query = query.order_by('first_name')
            else:
                query = query.order_by('last_name')

        if 'reverse' in sortfilter:
            query = query.reverse()

        self.sortfilter = sortfilter

        return query.all()

    def get_context_data(self, **kwargs):
        context = super(UserOverview, self).get_context_data(**kwargs)

        all_users = User.objects.count()

        # quotient of selected users and all users
        if all_users > 0:
            percent = self.object_list.count() * 100 / float(all_users)
        else:
            percent = 0

        # list of all existing categories
        structure_levels = [
            p['structure_level'] for p in
            User.objects.values('structure_level').exclude(structure_level='').distinct()]
        # list of all existing committees
        committees = [
            p['committee'] for p in
            User.objects.values('committee').exclude(committee='').distinct()]
        # context vars
        context.update({
            'allusers': all_users,
            'request_user': self.request.user,
            'percent': round(percent, 1),
            'structure_levels': structure_levels,
            'committees': committees,
            'cookie': [
                'participant_sortfilter', urlencode(decodedict(self.sortfilter),
                doseq=True)],
            'sortfilter': self.sortfilter})
        return context


class UserDetailView(DetailView, PermissionMixin):
    """
    Classed based view to show a specific user in the interface.
    """
    permission_required = 'participant.can_see_participant'
    model = User
    template_name = 'participant/user_detail.html'
    context_object_name = 'shown_user'


class GroupDetailView(DetailView, PermissionMixin):
    """
    Classed based view to show a specific group in the interface.
    """
    permission_required = 'participant.can_manage_participant'
    model = Group
    template_name = 'participant/group_detail.html'
    context_object_name = 'group'


class UserCreateView(CreateView):
    """
    Create a new participant.
    """
    permission_required = 'participant.can_manage_participant'
    template_name = 'participant/edit.html'
    model = User
    context_object_name = 'edit_user'
    form_class = UserCreateForm
    success_url_name = 'user_overview'

    def manipulate_object(self, form):
        self.object.username = gen_username(
            form.cleaned_data['first_name'], form.cleaned_data['last_name'])
        if not self.object.default_password:
            self.object.default_password = gen_password()
        self.object.set_password(self.object.default_password)


class UserUpdateView(UpdateView):
    """
    Update an existing participant.
    """
    permission_required = 'participant.can_manage_participant'
    template_name = 'participant/edit.html'
    model = User
    context_object_name = 'edit_user'
    form_class = UserUpdateForm
    success_url_name = 'user_overview'


class UserDeleteView(DeleteView):
    """
    Delete an participant.
    """
    permission_required = 'participant.can_manage_participant'
    model = User
    success_url_name = 'user_overview'

    def pre_redirect(self, request, *args, **kwargs):
        if self.get_object() == self.request.user:
            messages.error(request, _("You can not delete yourself."))
        else:
            super(UserDeleteView, self).pre_redirect(request, *args, **kwargs)


class SetUserStatusView(RedirectView, SingleObjectMixin):
    """
    Activate or deactivate an user.
    """
    permission_required = 'participant.can_manage_participant'
    allow_ajax = True
    url_name = 'user_overview'
    model = User

    def pre_redirect(self, request, *args, **kwargs):
        self.object = self.get_object()
        action = kwargs['action']
        if action == 'activate':
            self.object.is_active = True
        elif action == 'deactivate':
            if self.get_object().user == self.request.user:
                messages.error(request, _("You can not deactivate yourself."))
                return
            elif self.get_object().is_superuser:
                messages.error(request, _("You can not deactivate the administrator."))
                return
            self.object.is_active = False
        elif action == 'toggle':
            self.object.is_active = not self.object.is_active
        self.object.save()
        return super(SetUserStatusView, self).pre_redirect(request, *args, **kwargs)

    def get_ajax_context(self, **kwargs):
        context = super(SetUserStatusView, self).get_ajax_context(**kwargs)
        context['active'] = self.object.is_active
        return context


class ParticipantsListPDF(PDFView):
    """
    Generate the userliste as PDF.
    """
    permission_required = 'participant.can_see_participant'
    filename = ugettext_lazy("Participant-list")
    document_title = ugettext_lazy('List of Participants')

    def append_to_pdf(self, story):
        data = [['#', _('Last Name'), _('First Name'), _('Group'), _('Type'),
                 _('Committee')]]
        if config['participant_sort_users_by_first_name']:
            sort = 'first_name'
        else:
            sort = 'last_name'
        counter = 0
        for user in User.objects.all().order_by(sort):
            counter += 1
            data.append([
                counter,
                Paragraph(user.last_name, stylesheet['Tablecell']),
                Paragraph(user.first_name, stylesheet['Tablecell']),
                Paragraph(user.structure_level, stylesheet['Tablecell']),
                Paragraph(user.get_type_display(), stylesheet['Tablecell']),
                Paragraph(user.committee, stylesheet['Tablecell'])])
        t = LongTable(data, style=[
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LINEABOVE', (0, 0), (-1, 0), 2, colors.black),
            ('LINEABOVE', (0, 1), (-1, 1), 1, colors.black),
            ('LINEBELOW', (0, -1), (-1, -1), 2, colors.black),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1),
                (colors.white, (.9, .9, .9)))])
        t._argW[0] = 0.75 * cm
        story.append(t)


class ParticipantsPasswordsPDF(PDFView):
    """
    Generate the Welcomepaper for the users.
    """
    permission_required = 'participant.can_manage_participant'
    filename = ugettext_lazy("Participant-passwords")
    top_space = 0

    def get_template(self, buffer):
        return SimpleDocTemplate(
            buffer, topMargin=-6, bottomMargin=-6,
            leftMargin=0, rightMargin=0, showBoundary=False)

    def build_document(self, pdf_document, story):
        pdf_document.build(story)

    def append_to_pdf(self, story):
        data = []
        participant_pdf_system_url = config["participant_pdf_system_url"]
        participant_pdf_welcometext = config["participant_pdf_welcometext"]
        if config['participant_sort_users_by_first_name']:
            sort = 'first_name'
        else:
            sort = 'last_name'
        for user in User.objects.all().order_by(sort):
            cell = []
            cell.append(Spacer(0, 0.8 * cm))
            cell.append(Paragraph(_("Account for OpenSlides"),
                        stylesheet['Ballot_title']))
            cell.append(Paragraph(_("for %s") % (user),
                        stylesheet['Ballot_subtitle']))
            cell.append(Spacer(0, 0.5 * cm))
            cell.append(Paragraph(_("User: %s") % (user.username),
                        stylesheet['Monotype']))
            cell.append(
                Paragraph(
                    _("Password: %s")
                    % (user.default_password), stylesheet['Monotype']))
            cell.append(Spacer(0, 0.5 * cm))
            cell.append(
                Paragraph(
                    _("URL: %s") % (participant_pdf_system_url),
                    stylesheet['Ballot_option']))
            cell.append(Spacer(0, 0.5 * cm))
            cell2 = []
            cell2.append(Spacer(0, 0.8 * cm))
            if participant_pdf_welcometext is not None:
                cell2.append(Paragraph(
                    participant_pdf_welcometext.replace('\r\n', '<br/>'),
                    stylesheet['Ballot_subtitle']))

            data.append([cell, cell2])

        # add empty table line if no participants available
        if not data:
            data.append(['', ''])
        # build table
        t = Table(data, 10.5 * cm, 7.42 * cm)
        t.setStyle(TableStyle([
            ('LINEBELOW', (0, 0), (-1, 0), 0.25, colors.grey),
            ('LINEBELOW', (0, 1), (-1, 1), 0.25, colors.grey),
            ('LINEBELOW', (0, 1), (-1, -1), 0.25, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        story.append(t)


class UserImportView(FormView):
    """
    Import Users via csv.
    """
    permission_required = 'participant.can_manage_participant'
    template_name = 'participant/import.html'
    form_class = UserImportForm

    def form_valid(self, form):
        # check for valid encoding (will raise UnicodeDecodeError if not)
        success, error_messages = import_users(self.request.FILES['csvfile'])
        for message in error_messages:
            messages.error(self.request, message)
        if success:
            messages.success(
                self.request,
                _('%d new participants were successfully imported.') % success)
        return super(UserImportView, self).form_valid(form)


class ResetPasswordView(SingleObjectMixin, QuestionMixin, RedirectView):
    """
    Set the Passwort for a user to his default password.
    """
    permission_required = 'participant.can_manage_participant'
    model = User
    allow_ajax = True
    question = ugettext_lazy('Do you really want to reset the password?')

    def get(self, request, *args, **kwargs):
        self.object = self.get_object()
        return super(ResetPasswordView, self).get(request, *args, **kwargs)

    def get_redirect_url(self, **kwargs):
        return reverse('user_edit', args=[self.object.id])

    def case_yes(self):
        self.object.reset_password()

    def get_success_message(self):
        return _('The Password for %s was successfully reset.') % html_strong(self.object)


class GroupOverview(ListView):
    """
    Overview over all groups.
    """
    permission_required = 'participant.can_manage_participant'
    template_name = 'participant/group_overview.html'
    context_object_name = 'groups'
    model = Group


class GroupCreateView(CreateView):
    """
    Create a new group.
    """
    permission_required = 'participant.can_manage_participant'
    template_name = 'participant/group_edit.html'
    context_object_name = 'group'
    model = Group
    form_class = GroupForm
    success_url_name = 'user_group_overview'

    def get(self, request, *args, **kwargs):
        delete_default_permissions()
        return super(GroupCreateView, self).get(request, *args, **kwargs)


class GroupUpdateView(UpdateView):
    """
    Update an existing group.
    """
    permission_required = 'participant.can_manage_participant'
    template_name = 'participant/group_edit.html'
    model = Group
    context_object_name = 'group'
    form_class = GroupForm
    success_url_name = 'user_group_overview'

    def get(self, request, *args, **kwargs):
        delete_default_permissions()
        return super(GroupUpdateView, self).get(request, *args, **kwargs)


class GroupDeleteView(DeleteView):
    """
    Delete a Group.
    """
    permission_required = 'participant.can_manage_participant'
    model = Group
    success_url_name = 'user_group_overview'

    def pre_redirect(self, request, *args, **kwargs):
        if self.get_object().name.lower() in ['anonymous', 'registered']:
            messages.error(request, _("You can not delete this Group."))
        else:
            super(GroupDeleteView, self).pre_redirect(request, *args, **kwargs)


class Config(FormView):
    """
    Config page for the participant app.
    """
    permission_required = 'config.can_manage_config'
    form_class = ConfigForm
    template_name = 'participant/config.html'
    success_url_name = 'config_participant'

    def get_initial(self):
        return {
            'participant_pdf_system_url': config['participant_pdf_system_url'],
            'participant_pdf_welcometext': config['participant_pdf_welcometext'],
            'participant_sort_users_by_first_name': config['participant_sort_users_by_first_name']}

    def form_valid(self, form):
        config['participant_pdf_system_url'] = (
            form.cleaned_data['participant_pdf_system_url'])
        config['participant_pdf_welcometext'] = (
            form.cleaned_data['participant_pdf_welcometext'])
        config['participant_sort_users_by_first_name'] = (
            form.cleaned_data['participant_sort_users_by_first_name'])
        messages.success(
            self.request,
            _('Participants settings successfully saved.'))
        return super(Config, self).form_valid(form)


def login(request):
    extra_content = {}
    try:
        admin = User.objects.get(pk=1)
        if admin.check_password(admin.default_password):
            extra_content['first_time_message'] = _(
                "Installation was successfully! Use %(user)s "
                "(password: %(password)s) for first login.<br>"
                "<strong>Important:</strong> Please change the password after "
                "first login! Otherwise this message still appears for "
                "everyone  and could be a security risk.") % {
                    'user': html_strong(admin.username),
                    'password': html_strong(admin.default_password)}
            extra_content['next'] = reverse('password_change')
    except User.DoesNotExist:
        pass
    return django_login(request, template_name='participant/login.html', extra_context=extra_content)


@login_required
@template('participant/settings.html')
def user_settings(request):
    """
    Edit own user account.
    """
    if request.method == 'POST':
        form_user = UsersettingsForm(request.POST, instance=request.user)
        if form_user.is_valid():
            form_user.save()
            language = request.LANGUAGE_CODE = \
                request.session['django_language'] = form_user.cleaned_data['language']
            activate(language)
            messages.success(request, _('User settings successfully saved.'))
        else:
            messages.error(request, _('Please check the form for errors.'))
    else:
        language = request.session.get('django_language', request.LANGUAGE_CODE)
        form_user = UsersettingsForm(instance=request.user, initial={'language': language})

    return {
        'form': form_user,
        'edituser': request.user,
    }


@login_required
@template('participant/password_change.html')
def user_settings_password(request):
    """
    Edit own password.
    """
    if request.method == 'POST':
        form = PasswordChangeForm(request.user, request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, _('Password successfully changed.'))
            return redirect(reverse('dashboard'))
        else:
            messages.error(request, _('Please check the form for errors.'))
    else:
        form = PasswordChangeForm(user=request.user)

    return {
        'form': form,
    }


def register_tab(request):
    """
    Register the participant tab.
    """
    selected = request.path.startswith('/participant/')
    return Tab(
        title=_('Participants'),
        app='participant',
        url=reverse('user_overview'),
        permission=(
            request.user.has_perm('participant.can_see_participant') or
            request.user.has_perm('participant.can_manage_participant')),
        selected=selected)


def get_widgets(request):
    """
    Returns all widgets of the participant app. This is a user_widget, a
    group_widget and a personal_info_widget.
    """
    return [
        #get_personal_info_widget(request),
        get_user_widget(request),
        get_group_widget(request)]


## def get_personal_info_widget(request):
    ## """
    ## Provides a widget for personal info. It shows your submitted motions
    ## and where you are supporter or candidate.
    ## """
    ## personal_info_context = {
        ## 'submitted_motions': Motion.objects.filter(submitter=request.user),
        ## 'config_motion_min_supporters': config['motion_min_supporters'],
        ## 'supported_motions': Motion.objects.filter(motionsupporter=request.user),
        ## 'assignments': Assignment.objects.filter(
            ## assignmentcandidate__person=request.user,
            ## assignmentcandidate__blocked=False)}
    ## return Widget(
        ## name='personal_info',
        ## display_name=_('My motions and elections'),
        ## template='participant/personal_info_widget.html',
        ## context=personal_info_context,
        ## permission_required=None,
        ## default_column=1)


def get_user_widget(request):
    """
    Provides a widget with all users. This is for short activation of
    user slides.
    """
    return Widget(
        name='user',
        display_name=_('Participants'),
        template='participant/user_widget.html',
        context={'users': User.objects.all()},
        permission_required='projector.can_manage_projector',
        default_column=1)


def get_group_widget(request):
    """
    Provides a widget with all groups. This is for short activation of
    group slides.
    """
    return Widget(
        name='group',
        display_name=_('Groups'),
        template='participant/group_widget.html',
        context={'groups': Group.objects.all()},
        permission_required='projector.can_manage_projector',
        default_column=1)
