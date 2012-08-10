#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.participant.views
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Views for the participant app.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

# for python 2.5 support
from __future__ import with_statement

import csv
from urllib import urlencode

try:
    from urlparse import parse_qs
except ImportError:  # python <= 2.5 grab it from cgi
    from cgi import parse_qs

from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, PageBreak, Paragraph, LongTable, Spacer, Table,
    TableStyle)

from django.db import transaction
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User, Group
from django.contrib.auth.forms import PasswordChangeForm
from django.contrib.auth.views import login as django_login
from django.core.urlresolvers import reverse
from django.shortcuts import redirect
from django.utils.translation import ugettext as _, ungettext, ugettext_lazy

from openslides.utils import csv_ext
from openslides.utils.pdf import stylesheet
from openslides.utils.template import Tab
from openslides.utils.utils import (
    template, permission_required, gen_confirm_form, ajax_request, decodedict,
    encodedict, delete_default_permissions, html_strong)
from openslides.utils.views import (
    FormView, PDFView, TemplateView, CreateView, UpdateView, DeleteView,
    RedirectView, SingleObjectMixin, ListView)

from openslides.config.models import config

from openslides.participant.models import OpenSlidesUser, OpenSlidesGroup
from openslides.participant.api import gen_username, gen_password
from openslides.participant.forms import (
    UserCreateForm, UserUpdateForm, OpenSlidesUserForm, UsersettingsForm,
    UserImportForm, GroupForm, AdminPasswordChangeForm, ConfigForm)


class Overview(ListView):
    """
    Show all participants.
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

        for value in [u'gender', u'category', u'type', u'committee', u'status',
                      u'sort', u'reverse']:
            if value in self.request.REQUEST:
                if self.request.REQUEST[value] == '---':
                    try:
                        del sortfilter[value]
                    except KeyError:
                        pass
                else:
                    sortfilter[value] = [self.request.REQUEST[value]]

        query = OpenSlidesUser.objects
        if 'gender' in sortfilter:
            query = query.filter(gender__iexact=sortfilter['gender'][0])
        if 'category' in sortfilter:
            query = query.filter(category__iexact=sortfilter['category'][0])
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
                    ['category', 'type', 'committee', 'comment']):
                query = query.order_by(
                    'openslidesuser__%s' % sortfilter['sort'][0])
        else:
            query = query.order_by('last_name')

        if 'reverse' in sortfilter:
            query = query.reverse()

        self.sortfilter = sortfilter

        return query.all()

    def get_context_data(self, **kwargs):
        context = super(Overview, self).get_context_data(**kwargs)

        all_users = User.objects.count()

        # quotient of selected users and all users
        if all_users > 0:
            percent = self.object_list.count() * 100 / float(all_users)
        else:
            percent = 0

        # list of all existing categories
        categories = [p['category'] for p in OpenSlidesUser.objects.values('category')
            .exclude(category='').distinct()]

        # list of all existing committees
        committees = [p['committee'] for p in OpenSlidesUser.objects.values('committee')
            .exclude(committee='').distinct()]
        context.update({
            'allusers': all_users,
            'percent': round(percent, 1),
            'categories': categories,
            'committees': committees,
            'cookie': ['participant_sortfilter', urlencode(decodedict(self.sortfilter),
                doseq=True)],
            'sortfilter': self.sortfilter})
        return context


class UserCreateView(CreateView):
    """
    Create a new participant.
    """
    permission_required = 'participant.can_manage_participant'
    template_name = 'participant/edit.html'
    model = OpenSlidesUser
    context_object_name = 'edit_user'
    form_class = UserCreateForm
    success_url = 'user_overview'
    apply_url = 'participant_edit'

    def manipulate_object(self, form):
        self.object.username = gen_username(form.cleaned_data['first_name'], form.cleaned_data['last_name'])
        if not self.object.firstpassword:
            self.object.firstpassword = gen_password()


class UserUpdateView(UpdateView):
    """
    Update an existing participant.
    """
    permission_required = 'participant.can_manage_participant'
    template_name = 'participant/edit.html'
    model = OpenSlidesUser
    context_object_name = 'edit_user'
    form_class = UserUpdateForm
    success_url = 'user_overview'
    apply_url = 'participant_edit'


class UserDeleteView(DeleteView):
    """
    Delete an participant.
    """
    permission_required = 'participant.can_manage_participant'
    model = OpenSlidesUser
    url = 'user_overview'


class SetUserStatusView(RedirectView, SingleObjectMixin):
    """
    Activate or deactivate an user.
    """
    permission_required = 'participant.can_manage_participant'
    allow_ajax = True
    url = 'user_overview'
    model = OpenSlidesUser

    def pre_redirect(self, request, *args, **kwargs):
        self.object = self.get_object()
        action = kwargs['action']
        if action == 'activate':
            self.object.is_active = True
        elif action == 'deactivate':
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
        sort = 'last_name'
        counter = 0
        for user in OpenSlidesUser.objects.all().order_by(sort):
            counter += 1
            data.append([
                counter,
                Paragraph(user.last_name, stylesheet['Tablecell']),
                Paragraph(user.first_name, stylesheet['Tablecell']),
                Paragraph(user.category, stylesheet['Tablecell']),
                Paragraph(user.type, stylesheet['Tablecell']),
                Paragraph(user.committee, stylesheet['Tablecell'])
            ])
        t = LongTable(data,
            style=[
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
        return SimpleDocTemplate(buffer, topMargin=-6, bottomMargin=-6,
            leftMargin=0, rightMargin=0, showBoundary=False)

    def build_document(self, pdf_document, story):
        pdf_document.build(story)

    def append_to_pdf(self, story):
        data = []
        participant_pdf_system_url = config["participant_pdf_system_url"]
        participant_pdf_welcometext = config["participant_pdf_welcometext"]
        for user in OpenSlidesUser.objects.all().order_by('last_name'):
            cell = []
            cell.append(Spacer(0, 0.8 * cm))
            cell.append(Paragraph(_("Account for OpenSlides"),
                        stylesheet['Ballot_title']))
            cell.append(Paragraph(_("for %s") % (user),
                        stylesheet['Ballot_subtitle']))
            cell.append(Spacer(0, 0.5 * cm))
            cell.append(Paragraph(_("User: %s") % (user.username),
                        stylesheet['Monotype']))
            cell.append(Paragraph(_("Password: %s")
                % (user.firstpassword), stylesheet['Monotype']))
            cell.append(Spacer(0, 0.5 * cm))
            cell.append(Paragraph(_("URL: %s")
                % (participant_pdf_system_url),
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
            messages.success(request, _('User settings successfully saved.'))
        else:
            messages.error(request, _('Please check the form for errors.'))
    else:
        form_user = UsersettingsForm(instance=request.user)

    return {
        'form_user': form_user,
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
            return redirect(reverse('user_settings'))
        else:
            messages.error(request, _('Please check the form for errors.'))
    else:
        form = PasswordChangeForm(user=request.user)

    return {
        'form': form,
    }


@permission_required('participant.can_manage_participant')
@template('participant/import.html')
def user_import(request):
    """
    Import Users via csv.
    """
    from openslides.application.models import Application
    try:
        request.user.profile
        messages.error(request, _('The import function is available for the admin (without user profile) only.'))
        return redirect(reverse('user_overview'))
    except Profile.DoesNotExist:
        pass
    except AttributeError:
        # AnonymousUser
        pass

    if request.method == 'POST':
        form = UserImportForm(request.POST, request.FILES)
        if form.is_valid():
            try:
                # check for valid encoding (will raise UnicodeDecodeError if not)
                request.FILES['csvfile'].read().decode('utf-8')
                request.FILES['csvfile'].seek(0)

                with transaction.commit_on_success():

                    old_users = {}
                    applications_mapped = 0
                    applications_review = 0
                    applications_removed = 0

                    try:
                        janitor = User.objects.get(username='__system__.janitor')
                    except User.DoesNotExist:
                        janitor = User()
                        janitor.first_name = ''
                        janitor.last_name = ''
                        janitor.username = '__system__.janitor'
                        janitor.save()

                    applications = Application.objects.all()
                    for application in applications:
                        if form.cleaned_data['application_handling'] == 'DISCARD':
                            # need to do this explicit since some applications may belong
                            # to __system__.janitor which is a permanent user
                            application.delete(force=True)
                            applications_removed += 1
                        else:
                            # collect all applications and map them to their submitters
                            submitter = application.submitter
                            skey = '%s_%s' % (submitter.first_name, submitter.last_name)

                            if not skey in old_users:
                                old_users[skey] = []
                            old_users[skey].append(application.id)

                            application.submitter = janitor
                            application.save()

                            if application.supporter.all():
                                application.writelog(_('Supporters removed after user import.'), user=request.user)

                    profiles = Profile.objects.all()
                    for profile in profiles:
                        profile.user.delete()
                        profile.delete()
                    i = -1
                    dialect = csv.Sniffer().sniff(request.FILES['csvfile'].readline())
                    dialect = csv_ext.patchup(dialect)
                    request.FILES['csvfile'].seek(0)

                    for (lno, line) in enumerate(csv.reader(request.FILES['csvfile'], dialect=dialect)):
                        i += 1
                        if i > 0:
                            try:
                                (first_name, last_name, gender, group, type, committee, comment) = line[:7]
                            except ValueError:
                                messages.error(request, _('Ignoring malformed line %d in import file.') % (lno + 1))
                                i -= 1
                                continue
                            user = User()
                            user.last_name = last_name
                            user.first_name = first_name
                            user.username = gen_username(first_name, last_name)
                            #user.email = email
                            user.save()
                            profile = Profile()
                            profile.user = user
                            profile.gender = gender
                            profile.group = group
                            profile.type = type
                            profile.committee = committee
                            profile.comment = comment
                            profile.firstpassword = gen_password()
                            profile.user.set_password(profile.firstpassword)
                            profile.user.save()
                            profile.save()

                            if type == 'delegate':
                                delegate = Group.objects.get(name='Delegierter')
                                user.groups.add(delegate)
                            else:
                                observer = Group.objects.get(name='Beobachter')
                                user.groups.add(observer)

                            if form.cleaned_data['application_handling'] == 'REASSIGN':
                                # live remap
                                skey = '%s_%s' % (user.first_name, user.last_name)
                                if skey in old_users:
                                    for appid in old_users[skey]:
                                        try:
                                            application = Application.objects.get(id=appid)
                                            application.submitter = user
                                            application.save()
                                            application.writelog(_('Reassigned to "%s" after (re)importing users.') % ("%s %s" % (user.first_name, user.last_name)), user=request.user)
                                            applications_mapped += 1
                                        except Application.DoesNotExist:
                                            messages.error(request, _('Could not reassing application %d - object not found!') % appid)
                                    del old_users[skey]

                    if old_users:
                        # mark all applications without a valid user as 'needs review'
                        # this will account for *all* applications if application_mode == 'INREVIEW'
                        for skey in old_users:
                            for appid in old_users[skey]:
                                try:
                                    application = Application.objects.get(id=appid)
                                    if application.status != 'rev':
                                        application.set_status(user=request.user, status='rev', force=True)
                                    applications_review += 1
                                except Application.DoesNotExist:
                                    messages.error(request, _('Could not reassing application %d - object not found!') % appid)

                    if applications_review:
                        messages.warning(request, ungettext('%d application could not be reassigned and needs a review!',
                                                    '%d applications could not be reassigned and need a review!', applications_review) % applications_review)
                    if applications_mapped:
                        messages.success(request, ungettext('%d application was successfully reassigned.',
                                                    '%d applications were successfully reassigned.', applications_mapped) % applications_mapped)
                    if applications_removed:
                        messages.warning(request, ungettext('%d application was discarded.',
                                                    '%d applications were discarded.', applications_removed) % applications_removed)

                    if i > 0:
                        messages.success(request, _('%d new participants were successfully imported.') % i)
                    return redirect(reverse('user_overview'))
            except csv.Error:
                message.error(request, _('Import aborted because of severe errors in the input file.'))
            except UnicodeDecodeError:
                messages.error(request, _('Import file has wrong character encoding, only UTF-8 is supported!'))
        else:
            messages.error(request, _('Please check the form for errors.'))
    else:
        messages.warning(request, _("Attention: All existing participants will be removed if you import new participants."))
        if Application.objects.all():
            messages.warning(request, _("Attention: Supporters from all existing applications will be removed."))
            messages.warning(request, _("Attention: Applications which can't be mapped to new users will be set to 'Needs Review'."))
        form = UserImportForm()
    return {
        'form': form,
    }


@permission_required('participant.can_manage_participant')
def reset_password(request, user_id):
    """
    Reset the Password.
    """
    user = User.objects.get(pk=user_id)
    if request.method == 'POST':
        user.profile.reset_password()
        messages.success(request,
            _('The Password for <b>%s</b> was successfully reset.') % user)
    else:
        gen_confirm_form(request,
            _('Do you really want to reset the password for <b>%s</b>?') % user,
            reverse('user_reset_password', args=[user_id]))
    return redirect(reverse('user_edit', args=[user_id]))


def login(request):
    extra_content = {}
    try:
        admin = User.objects.get(pk=1)
        if admin.check_password(config['admin_password']):
            extra_content['first_time_message'] = _(
                "Installation was successfully! Use %(user)s "
                "(password: %(password)s) for first login.<br>"
                "<strong>Important:</strong> Please change the password after "
                "first login! Otherwise this message still appears for everyone "
                "and could be a security risk.") % {
                'user': html_strong(admin.username),
                'password': html_strong(config['admin_password'])}
            extra_content['next'] = reverse('password_change')
    except User.DoesNotExist:
        pass
    return django_login(request, template_name='participant/login.html', extra_context=extra_content)




@permission_required('participant.can_manage_participant')
@template('participant/group_overview.html')
def get_group_overview(request):
    """
    Show all groups.
    """
    if config['system_enable_anonymous']:
        groups = Group.objects.all()
    else:
        groups = Group.objects.exclude(name='Anonymous')
    return {
        'groups': groups,
    }


@permission_required('participant.can_manage_participant')
@template('participant/group_edit.html')
def group_edit(request, group_id=None):
    """
    Edit a group.
    """
    if group_id is not None:
        try:
            group = Group.objects.get(id=group_id)
        except Group.DoesNotExist:
            # TODO: return a 404 Object
            raise NameError("There is no group %d" % group_id)
    else:
        group = None
    delete_default_permissions()

    if request.method == 'POST':
        form = GroupForm(request.POST, instance=group)
        if form.is_valid():
            # TODO: This can be done inside the form
            group_name = form.cleaned_data['name'].lower()

            # TODO: Why is this code called on any request and not only, if the
            # anonymous_group is edited?
            try:
                anonymous_group = Group.objects.get(name='Anonymous')
            except Group.DoesNotExist:
                anonymous_group = None

            # special handling for anonymous auth
            # TODO: This code should be a form validator.
            if group is None and group_name.strip().lower() == 'anonymous':
                # don't allow to create this group
                messages.error(request,
                    _('Group name "%s" is reserved for internal use.')
                    % group_name)
                return {
                    'form': form,
                    'group': group
                }

            group = form.save()
            try:
                openslides_group = OpenSlidesGroup.objects.get(group=group)
            except OpenSlidesGroup.DoesNotExist:
                django_group = None
            if form.cleaned_data['as_user'] and django_group is None:
                OpenSlidesGroup(group=group).save()
            elif not form.cleaned_data['as_user'] and django_group:
                django_group.delete()

            if anonymous_group is not None and \
               anonymous_group.id == group.id:
                # prevent name changes -
                # XXX: I'm sure this could be done as *one* group.save()
                group.name = 'Anonymous'
                group.save()

            if group_id is None:
                messages.success(request,
                    _('New group was successfully created.'))
            else:
                messages.success(request, _('Group was successfully modified.'))
            if not 'apply' in request.POST:
                return redirect(reverse('user_group_overview'))
            if group_id is None:
                return redirect(reverse('user_group_edit', args=[group.id]))
        else:
            messages.error(request, _('Please check the form for errors.'))
    else:
        if group and OpenSlidesGroup.objects.filter(group=group).exists():
            initial = {'as_user': True}
        else:
            initial = {'as_user': False}

        form = GroupForm(instance=group, initial=initial)
    return {
        'form': form,
        'group': group,
    }


@permission_required('participant.can_manage_participant')
def group_delete(request, group_id):
    """
    Delete a group.
    """
    group = Group.objects.get(pk=group_id)
    if request.method == 'POST':
        group.delete()
        messages.success(request,
            _('Group <b>%s</b> was successfully deleted.') % group)
    else:
        gen_confirm_form(request,
            _('Do you really want to delete <b>%s</b>?') % group,
            reverse('user_group_delete', args=[group_id]))
    return redirect(reverse('user_group_overview'))


class Config(FormView):
    """
    Config page for the participant app.
    """
    permission_required = 'config.can_manage_config'
    form_class = ConfigForm
    template_name = 'participant/config.html'

    def get_initial(self):
        return {
            'participant_pdf_system_url': config['participant_pdf_system_url'],
            'participant_pdf_welcometext': config['participant_pdf_welcometext']
        }

    def form_valid(self, form):
        config['participant_pdf_system_url'] = \
            form.cleaned_data['participant_pdf_system_url']
        config['participant_pdf_welcometext'] = \
            form.cleaned_data['participant_pdf_welcometext']
        messages.success(self.request,
            _('Participants settings successfully saved.'))
        return super(Config, self).form_valid(form)


def register_tab(request):
    """
    Register the participant tab.
    """
    selected = request.path.startswith('/participant/')
    return Tab(
        title=_('Participants'),
        url=reverse('user_overview'),
        permission=request.user.has_perm('participant.can_see_participant')
            or request.user.has_perm('participant.can_manage_participant'),
        selected=selected,
    )
