#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.participant.views
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Views for the participant app.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from __future__ import with_statement

import csv
import utils.csv_ext
from urllib import urlencode

try:
    from urlparse import parse_qs
except ImportError: # python <= 2.5 grab it from cgi
    from cgi import parse_qs

from django.http import HttpResponse
from django.shortcuts import redirect
from django.template import RequestContext
from django.contrib.auth.models import User, Group
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import SetPasswordForm
from django.contrib import messages
from django.core.urlresolvers import reverse
from django.utils.translation import ugettext as _, ungettext
from django.db import transaction
from django.db.models import Avg, Max, Min, Count

from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, PageBreak, Paragraph, LongTable, Spacer, Table, TableStyle

from participant.models import Profile
from participant.api import gen_username, gen_password
from participant.forms import (UserNewForm, UserEditForm, ProfileForm,
                               UsersettingsForm, UserImportForm, GroupForm,
                               AdminPasswordChangeForm, ConfigForm)
from application.models import Application

from config.models import config

from utils.utils import (template, permission_required, gen_confirm_form,
                         ajax_request, decodedict, encodedict)
from utils.pdf import stylesheet
from utils.template import Tab
from utils.views import (FormView, PDFView)
from utils.utils import delete_default_permissions


@permission_required('participant.can_see_participant')
@template('participant/overview.html')
def get_overview(request):
    try:
        sortfilter = encodedict(parse_qs(request.COOKIES['participant_sortfilter']))
    except KeyError:
        sortfilter = {}

    for value in [u'gender', u'group', u'type', u'committee', u'status', u'sort', u'reverse']:
        if value in request.REQUEST:
            if request.REQUEST[value] == '---':
                try:
                    del sortfilter[value]
                except KeyError:
                    pass
            else:
                sortfilter[value] = [request.REQUEST[value]]

    query = User.objects
    if 'gender' in sortfilter:
        query = query.filter(profile__gender__iexact=sortfilter['gender'][0])
    if 'group' in sortfilter:
        query = query.filter(profile__group__iexact=sortfilter['group'][0])
    if 'type' in sortfilter:
        query = query.filter(profile__type__iexact=sortfilter['type'][0])
    if 'committee' in sortfilter:
        query = query.filter(profile__committee__iexact=sortfilter['committee'][0])
    if 'status' in sortfilter:
        query = query.filter(is_active=sortfilter['status'][0])
    if 'sort' in sortfilter:
        if sortfilter['sort'][0] in ['first_name', 'last_name', 'last_login']:
            query = query.order_by(sortfilter['sort'][0])
        elif sortfilter['sort'][0] in ['group', 'type', 'committee', 'comment']:
            query = query.order_by('profile__%s' % sortfilter['sort'][0])
    else:
        query = query.order_by('first_name')
    if 'reverse' in sortfilter:
        query = query.reverse()

    # list of filtered users (with profile)
    userlist = query.all()
    users = []
    for user in userlist:
        try:
            user.get_profile()
            users.append(user)
        except Profile.DoesNotExist:
            pass
    # list of all existing users (with profile)
    allusers = []
    for user in User.objects.all():
        try:
            user.get_profile()
            allusers.append(user)
        except Profile.DoesNotExist:
            pass
    # quotient of selected users and all users
    if len(allusers) > 0:
        percent = float(len(users)) * 100 / float(len(allusers))
    else:
        percent = 0
    # list of all existing groups
    groups = [p['group'] for p in Profile.objects.values('group').exclude(group='').distinct()]
    # list of all existing committees
    committees = [p['committee'] for p in Profile.objects.values('committee').exclude(committee='').distinct()]
    return {
        'users': users,
        'allusers': allusers,
        'percent': round(percent, 1),
        'groups': groups,
        'committees': committees,
        'cookie': ['participant_sortfilter', urlencode(decodedict(sortfilter), doseq=True)],
        'sortfilter': sortfilter,
    }

@permission_required('participant.can_manage_participant')
@template('participant/edit.html')
def edit(request, user_id=None):
    """
    View to create and edit users with profile.
    """
    if user_id is not None:
        user = User.objects.get(id=user_id)
    else:
        user = None

    if request.method == 'POST':
        if user_id is None:
            userform = UserNewForm(request.POST, prefix="user")
            profileform = ProfileForm(request.POST, prefix="profile")
        else:
            userform = UserEditForm(request.POST, instance=user, prefix="user")
            profileform = ProfileForm(request.POST, instance=user.profile, prefix="profile")

        if userform.is_valid() and profileform.is_valid():
            user = userform.save()
            if user_id is None:
                user.username = gen_username(user.first_name, user.last_name)
                user.save()
            profile = profileform.save(commit=False)
            profile.user = user
            if user_id is None:
                if not profile.firstpassword:
                    profile.firstpassword = gen_password()
                profile.user.set_password(profile.firstpassword)
                profile.user.save()
            profile.save()
            if user_id is None:
                messages.success(request, _('New participant was successfully created.'))
            else:
                messages.success(request, _('Participant was successfully modified.'))
            if not 'apply' in request.POST:
                return redirect(reverse('user_overview'))
            if user_id is None:
                return redirect(reverse('user_edit', args=[user.id]))
        else:
            messages.error(request, _('Please check the form for errors.'))
    else:
        if user_id is None:
            userform = UserNewForm(prefix="user")
            profileform = ProfileForm(prefix="profile")
        else:
            userform = UserEditForm(instance=user, prefix="user")
            profileform = ProfileForm(instance=user.profile, prefix="profile")

    return {
        'userform': userform,
        'profileform': profileform,
        'edituser': user,
    }

@permission_required('participant.can_manage_participant')
@template('confirm.html')
def user_delete(request, user_id):
    user = User.objects.get(pk=user_id)
    if request.method == 'POST':
        user.delete()
        messages.success(request, _('Participant <b>%s</b> was successfully deleted.') % user)
    else:
        gen_confirm_form(request, _('Do you really want to delete <b>%s</b>?') % user, reverse('user_delete', args=[user_id]))
    return redirect(reverse('user_overview'))

@permission_required('participant.can_manage_participant')
@template('confirm.html')
def user_set_active(request, user_id, active=True):
    try:
        user = User.objects.get(pk=user_id)
        user.is_active = active
        user.save()
    except User.DoesNotExist:
        messages.error(request, _('Participant %d does not exist.') % int(user_id))

    if request.is_ajax():
        if active:
            link = reverse('user_inactive', args=[user.id])
        else:
            link = reverse('user_active', args=[user.id])
        return ajax_request({'active': active,
                             'link': link})
    return redirect(reverse('user_overview'))

@permission_required('participant.can_manage_participant')
@template('participant/group_overview.html')
def get_group_overview(request):
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
    if group_id is not None:
        try:
            group = Group.objects.get(id=group_id)
        except Group.DoesNotExist:
            raise NameError("There is no group %d" % group_id)
    else:
        group = None
    delete_default_permissions()

    if request.method == 'POST':
        form = GroupForm(request.POST, instance=group)
        if form.is_valid():
            group_name = form.cleaned_data['name'].lower()

            try:
                anonymous_group = Group.objects.get(name='Anonymous')
            except Group.DoesNotExist:
                anonymous_group = None

            # special handling for anonymous auth
            if group is None and group_name.strip().lower() == 'anonymous':
                # don't allow to create this group
                messages.error(request, _('Group name "%s" is reserved for internal use.') % group_name)
                return {
                    'form' : form,
                    'group': group
                }

            group = form.save()
            if anonymous_group is not None and \
               anonymous_group.id == group.id:
                # prevent name changes - XXX: I'm sure this could be done as *one* group.save()
                group.name = 'Anonymous'
                group.save()

            if group_id is None:
                messages.success(request, _('New group was successfully created.'))
            else:
                messages.success(request, _('Group was successfully modified.'))
            if not 'apply' in request.POST:
                return redirect(reverse('user_group_overview'))
            if group_id is None:
                return redirect(reverse('user_group_edit', args=[group.id]))
        else:
            messages.error(request, _('Please check the form for errors.'))
    else:
        form = GroupForm(instance=group)
    return {
        'form': form,
        'group': group,
    }

@permission_required('participant.can_manage_participant')
def group_delete(request, group_id):
    group = Group.objects.get(pk=group_id)
    if request.method == 'POST':
        group.delete()
        messages.success(request, _('Group <b>%s</b> was successfully deleted.') % group)
    else:
        gen_confirm_form(request, _('Do you really want to delete <b>%s</b>?') % group, reverse('user_group_delete', args=[group_id]))
    return redirect(reverse('user_group_overview'))

@login_required
@template('participant/settings.html')
def user_settings(request):
    if request.method == 'POST':
        form_user = UsersettingsForm(request.POST,instance=request.user, prefix='user')
        form_password = SetPasswordForm(request.user,request.POST,prefix='password')
        if form_user.is_valid() and form_password.is_valid():
            form_user.save()
            form_password.save()
            messages.success(request, _('User settings successfully saved.'))
        else:
            messages.error(request, _('Please check the form for errors.'))
    else:
        form_user = UsersettingsForm(instance=request.user, prefix='user')
        form_password = SetPasswordForm(request.user,prefix='password')

    return {
        'form_user': form_user,
        'form_password': form_password,
        'edituser': request.user,
    }

@permission_required('participant.can_manage_participant')
@template('participant/import.html')
def user_import(request):
    try:
        request.user.profile
        messages.error(request, _('The import function is available for the superuser (without user profile) only.'))
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
                    dialect = utils.csv_ext.patchup(dialect)
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
    user = User.objects.get(pk=user_id)
    if request.method == 'POST':
        user.profile.reset_password()
        messages.success(request, _('The Password for <b>%s</b> was successfully reset.') % user)
    else:
        gen_confirm_form(request, _('Do you really want to reset the password for <b>%s</b>?') % user,
                         reverse('user_reset_password', args=[user_id]))
    return redirect(reverse('user_edit', args=[user_id]))


def register_tab(request):
    selected = True if request.path.startswith('/participant/') else False
    return Tab(
        title=_('Participants'),
        url=reverse('user_overview'),
        permission=request.user.has_perm('participant.can_see_participant') or request.user.has_perm('participant.can_manage_participant'),
        selected=selected,
    )


class ParticipantsListPDF(PDFView):
    permission_required = 'participant.can_see_participant'
    filename = _("Participant-list")
    document_title = _('List of Participants')

    def append_to_pdf(self, story):
        data= [['#', _('Last Name'), _('First Name'), _('Group'), _('Type'), _('Committee')]]
        sort = 'last_name'
        counter = 0
        for user in User.objects.all().order_by(sort):
            try:
                counter += 1
                user.get_profile()
                data.append([counter,
                        Paragraph(user.last_name, stylesheet['Tablecell']),
                        Paragraph(user.first_name, stylesheet['Tablecell']),
                        Paragraph(user.profile.group, stylesheet['Tablecell']),
                        Paragraph(user.profile.get_type_display(), stylesheet['Tablecell']),
                        Paragraph(user.profile.committee, stylesheet['Tablecell']),
                        ])
            except Profile.DoesNotExist:
                counter -= 1
                pass
        t=LongTable(data,
                        style=[
                            ('VALIGN',(0,0),(-1,-1), 'TOP'),
                            ('LINEABOVE',(0,0),(-1,0),2,colors.black),
                            ('LINEABOVE',(0,1),(-1,1),1,colors.black),
                            ('LINEBELOW',(0,-1),(-1,-1),2,colors.black),
                            ('ROWBACKGROUNDS', (0, 1), (-1, -1), (colors.white, (.9, .9, .9))),
                            ])
        t._argW[0]=0.75*cm
        story.append(t)


class ParticipantsPasswordsPDF(PDFView):
    permission_required = 'participant.can_manage_participant'
    filename = _("Participant-passwords")
    top_space = 0

    def get_template(self, buffer):
        return SimpleDocTemplate(buffer, topMargin=-6, bottomMargin=-6, leftMargin=0, rightMargin=0, showBoundary=False)

    def build_document(self, pdf_document, story):
        pdf_document.build(story)

    def append_to_pdf(self, story):
        data= []
        participant_pdf_system_url = config["participant_pdf_system_url"]
        participant_pdf_welcometext = config["participant_pdf_welcometext"]
        for user in User.objects.all().order_by('last_name'):
            try:
                user.get_profile()
                cell = []
                cell.append(Spacer(0,0.8*cm))
                cell.append(Paragraph(_("Account for OpenSlides"), stylesheet['Ballot_title']))
                cell.append(Paragraph(_("for %s") % (user.profile), stylesheet['Ballot_subtitle']))
                cell.append(Spacer(0,0.5*cm))
                cell.append(Paragraph(_("User: %s") % (user.username), stylesheet['Monotype']))
                cell.append(Paragraph(_("Password: %s") % (user.profile.firstpassword), stylesheet['Monotype']))
                cell.append(Spacer(0,0.5*cm))
                cell.append(Paragraph(_("URL: %s") % (participant_pdf_system_url), stylesheet['Ballot_option']))
                cell.append(Spacer(0,0.5*cm))
                cell2 = []
                cell2.append(Spacer(0,0.8*cm))
                if participant_pdf_welcometext is not None:
                    cell2.append(Paragraph(participant_pdf_welcometext.replace('\r\n','<br/>'), stylesheet['Ballot_subtitle']))

                data.append([cell,cell2])
            except Profile.DoesNotExist:
                pass

        t=Table(data, 10.5*cm, 7.42*cm)
        t.setStyle(TableStyle([ ('LINEBELOW', (0,0), (-1,0), 0.25, colors.grey),
                                ('LINEBELOW', (0,1), (-1,1), 0.25, colors.grey),
                                ('LINEBELOW', (0,1), (-1,-1), 0.25, colors.grey),
                                ('VALIGN', (0,0), (-1,-1), 'TOP'),
                              ]))
        story.append(t)



class Config(FormView):
    permission_required = 'config.can_manage_config'
    form_class = ConfigForm
    template_name = 'participant/config.html'

    def get_initial(self):
        return {
            'participant_pdf_system_url': config['participant_pdf_system_url'],
            'participant_pdf_welcometext': config['participant_pdf_welcometext'],
        }

    def form_valid(self, form):
        config['participant_pdf_system_url'] = form.cleaned_data['participant_pdf_system_url']
        config['participant_pdf_welcometext'] = form.cleaned_data['participant_pdf_welcometext']
        messages.success(self.request, _('Participants settings successfully saved.'))
        return super(Config, self).form_valid(form)
