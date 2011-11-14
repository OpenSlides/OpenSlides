#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.application.views
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Views for the application app.

    :copyright: 2011 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""
from __future__ import with_statement

import csv
from django.shortcuts import redirect
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User, Group
from django.core.urlresolvers import reverse
from django.utils.translation import ugettext as _
from django.utils.translation import ungettext
from django.db import transaction

from openslides.agenda.models import Item
from openslides.application.models import Application, AVersion
from openslides.application.forms import ApplicationForm, \
                                         ApplicationManagerForm, \
                                         ApplicationImportForm
from openslides.participant.models import Profile
from openslides.poll.models import Poll
from openslides.poll.forms import OptionResultForm, PollForm
from openslides.utils.utils import template, permission_required, \
                                   render_to_forbitten, del_confirm_form, gen_confirm_form
from openslides.utils.pdf import print_application, print_application_poll
from openslides.system.api import config_get

from openslides.participant.api import gen_username, gen_password

@permission_required('application.can_see_application')
@template('application/overview.html')
def overview(request):
    """
    View all applications
    """
    query = Application.objects
    if 'number' in request.GET:
        query = query.filter(number=None)
    if 'status' in request.GET:
        if 'statusvalue' in request.GET and 'on' in request.GET['status']:
            query = query.filter(status__iexact=request.GET['statusvalue'])
    try:
        sort = request.GET['sort']
        if sort in ['number', 'supporter', 'status', 'submitter', \
                    'aversion__time', 'aversion__title']:
            query = query.order_by(sort)
    except KeyError:
        query = query.order_by("number")
    if 'reverse' in request.GET:
        query = query.reverse()
    if 'needsup' in request.GET:
        applications = []
        for application in query.all():
            if not application.enough_supporters:
                applications.append(application)
    else:
        applications = query.all()
    return {
        'applications': applications,
        'min_supporters': int(config_get('application_min_supporters')),
    }


@permission_required('application.can_see_application')
@template('application/view.html')
def view(request, application_id, newest=False):
    """
    View one application.
    """
    application = Application.objects.get(pk=application_id)
    if newest:
        version = application.last_version
    else:
        version = application.public_version
    revisions = application.versions
    actions = application.get_allowed_actions(user=request.user)

    return {
        'application': application,
        'revisions': revisions,
        'actions': actions,
        'min_supporters': int(config_get('application_min_supporters')),
        'version': version,
        'results': application.results
    }


@login_required
@template('application/edit.html')
def edit(request, application_id=None):
    """
    View a form to edit or create a application.
    """
    if request.user.has_perm('application.can_manage_application'):
        is_manager = True
    else:
        is_manager = False

    if not is_manager \
    and not request.user.has_perm('application.can_create_application'):
        messages.error(request, _("You have not the necessary rights to create or edit applications."))
        return redirect(reverse('application_overview'))
    if application_id is not None:
        application = Application.objects.get(id=application_id)
        if not request.user == application.submitter and not is_manager:
            messages.error(request, _("You can not edit this application. You are not the submitter."))
            return redirect(reverse('application_view', args=[application.id]))
    else:
        application = None

    if request.method == 'POST':
        dataform = ApplicationForm(request.POST, prefix="data")
        valid = dataform.is_valid()

        if is_manager:
            managerform = ApplicationManagerForm(request.POST, \
                            instance=application, \
                            prefix="manager")
            valid = valid and managerform.is_valid()
        else:
            managerform = None

        if valid:
            del_supporters = True
            original_supporters = []
            if is_manager:
                if application:
                    for s in application.supporter.all():
                        original_supporters.append(s)
                application = managerform.save()
            elif application_id is None:
                application = Application(submitter=request.user)
            application.title = dataform.cleaned_data['title']
            application.text = dataform.cleaned_data['text']
            application.reason = dataform.cleaned_data['reason']
            application.save(request.user, trivial_change=dataform.cleaned_data['trivial_change'])
            if is_manager:
                # log added supporters
                supporters_added = []
                for s in application.supporter.all():
                    if s not in original_supporters:
                        try:
                            supporters_added.append(unicode(s.profile))
                        except Profile.DoesNotExist:
                            pass
                if len(supporters_added) > 0:
                    log_added = ", ".join(supporters_added)
                    application.writelog(_("Supporter: +%s") % log_added, request.user)
                # log removed supporters
                supporters_removed = []
                for s in original_supporters:
                    if s not in application.supporter.all():
                        try:
                            supporters_removed.append(unicode(s.profile))
                        except Profile.DoesNotExist:
                            pass
                if len(supporters_removed) > 0:
                    log_removed = ", ".join(supporters_removed)
                    application.writelog(_("Supporter: -%s") % log_removed, request.user)
            if application_id is None:
                messages.success(request, _('New application was successfully created.'))
            else:
                messages.success(request, _('Application was successfully modified.'))

            if not 'apply' in request.POST:
                return redirect(reverse('application_view', args=[application.id]))
            if application_id is None:
                return redirect(reverse('application_edit', args=[application.id]))
    else:
        if application_id is None:
            initial = {'text': config_get('application_preamble')}
        else:
            if application.status == "pub" and application.supporter.count() > 0:
                if request.user.has_perm('application.can_manage_application'):
                    messages.warning(request, _("Attention: Do you really want to edit this application? The supporters will <b>not</b> be removed automatically because you can manage applications. Please check if the supports are valid after your changing!"))
                else:
                    messages.warning(request, _("Attention: Do you really want to edit this application? All <b>%s</b> supporters will be removed! Try to convince the supporters again.") % application.supporter.count() )
            initial = {'title': application.title,
                       'text': application.text,
                       'reason': application.reason}

        dataform = ApplicationForm(initial=initial, prefix="data")
        if is_manager:
            if application_id is None:
                initial = {'submitter': str(request.user.id)}
            else:
                initial = {}
            managerform = ApplicationManagerForm(initial=initial, \
                                                 instance=application, \
                                                 prefix="manager")
        else:
            managerform = None
    return {
        'form': dataform,
        'managerform': managerform,
        'application': application,
    }

@login_required
@template('application/view.html')
def delete(request, application_id):
    """
    delete a application.
    """
    application = Application.objects.get(id=application_id)
    if not 'delete' in application.get_allowed_actions(user=request.user):
        messages.error(request, _("You can not delete application <b>%s</b>.") % application)
    else:
        if request.method == 'POST':
            try:
                title = str(application)
                application.delete()
                messages.success(request, _("Application <b>%s</b> was successfully deleted.") % title)
            except NameError, name:
                messages.error(request, name)
        else:
            del_confirm_form(request, application)
    return redirect(reverse('application_overview'))


@permission_required('application.can_manage_application')
@template('application/view.html')
def set_number(request, application_id):
    """
    set a number for an application.
    """
    try:
        Application.objects.get(pk=application_id).set_number(user=request.user)
        messages.success(request, _("Application number was successfully set."))
    except Application.DoesNotExist:
        pass
    except NameError:
        pass
    return redirect(reverse('application_view', args=[application_id]))


@permission_required('application.can_manage_application')
@template('application/view.html')
def permit(request, application_id):
    """
    permit an application.
    """
    try:
        Application.objects.get(pk=application_id).permit(user=request.user)
        messages.success(request, _("Application was successfully permitted."))
    except Application.DoesNotExist:
        pass
    return redirect(reverse('application_view', args=[application_id]))

@permission_required('application.can_manage_application')
@template('application/view.html')
def notpermit(request, application_id):
    """
    reject (not permit) an application.
    """
    try:
        Application.objects.get(pk=application_id).notpermit(user=request.user)
        messages.success(request, _("Application was successfully rejected."))
    except Application.DoesNotExist:
        pass
    return redirect(reverse('application_view', args=[application_id]))

@template('application/view.html')
def set_status(request, application_id=None, status=None):
    """
    set a status of an application.
    """
    try:
        if status is not None:
            application = Application.objects.get(pk=application_id)
            application.set_status(user=request.user, status=status)
            messages.success(request, _("Application status was set to: <b>%s</b>.") % application.get_status_display())
    except Application.DoesNotExist:
        pass
    return redirect(reverse('application_view', args=[application_id]))


@permission_required('application.can_manage_application')
@template('application/view.html')
def reset(request, application_id):
    """
    reset an application.
    """
    try:
        Application.objects.get(pk=application_id).reset(user=request.user)
        messages.success(request, _("Application status was reset.") )
    except Application.DoesNotExist:
        pass
    return redirect(reverse('application_view', args=[application_id]))


@permission_required('application.can_support_application')
@template('application/view.html')
def support(request, application_id):
    """
    support an application.
    """
    try:
        Application.objects.get(pk=application_id).support(user=request.user)
        messages.success(request, _("You have support the application successfully.") )
    except Application.DoesNotExist:
        pass
    return redirect(reverse('application_view', args=[application_id]))


@permission_required('application.can_support_application')
@template('application/view.html')
def unsupport(request, application_id):
    """
    unsupport an application.
    """
    try:
        Application.objects.get(pk=application_id).unsupport(user=request.user)
        messages.success(request, _("You have unsupport the application successfully.") )
    except Application.DoesNotExist:
        pass
    return redirect(reverse('application_view', args=[application_id]))


@permission_required('application.can_manage_application')
def set_active(request, application_id):
    item = Item.objects.get(itemapplication__application__id=application_id)
    item.set_active(False)
    return redirect(reverse('application_view', args=[application_id]))


@permission_required('application.can_manage_application')
@template('application/view.html')
def gen_poll(request, application_id):
    """
    gen a poll for this application.
    """
    try:
        poll = Application.objects.get(pk=application_id).gen_poll(user=request.user)
        messages.success(request, _("New vote was successfully created.") )
    except Application.DoesNotExist:
        pass
    return redirect(reverse('application_poll_view', args=[poll.id]))


@permission_required('application.can_manage_application')
def delete_poll(request, poll_id):
    """
    delete a poll from this application
    """
    poll = Poll.objects.get(pk=poll_id)
    application = poll.application
    count = application.poll_set.filter(id__lte=poll_id).count()
    if request.method == 'POST':
        poll.delete()
        messages.success(request, _('Poll was successfully deleted.'))
    else:
        del_confirm_form(request, poll, name=_("the %s. poll") % count)
    return redirect(reverse('application_view', args=[application.id]))


@permission_required('application.can_manage_application')
@template('application/poll_view.html')
def view_poll(request, poll_id):
    """
    view a poll for this application.
    """
    poll = Poll.objects.get(pk=poll_id)
    ballot = poll.ballot
    options = poll.options
    if request.user.has_perm('application.can_manage_application'):
        if request.method == 'POST':
            form = PollForm(request.POST, prefix="poll")
            if form.is_valid():
                poll.votesinvalid = form.cleaned_data['invalid'] or 0
                poll.votescast = form.cleaned_data['votescast'] or 0
                poll.save()

            for option in options:
                option.form = OptionResultForm(request.POST,
                                               prefix="o%d" % option.id)
                if option.form.is_valid():
                    option.voteyes = option.form.cleaned_data['yes']
                    option.voteno = option.form.cleaned_data['no'] or 0
                    option.voteundesided = option.form. \
                                           cleaned_data['undesided'] or 0
                    option.save()
                    messages.success(request, _("Votes are successfully saved.") )
            if not 'apply' in request.POST:
                return redirect(reverse('application_view', args=[poll.application.id]))
        else:
            form = PollForm(initial={'invalid': poll.votesinvalid, 'votescast': poll.votescast}, prefix="poll")
            for option in options:
                option.form = OptionResultForm(initial={
                    'yes': option.voteyes,
                    'no': option.voteno,
                    'undesided': option.voteundesided,
                }, prefix="o%d" % option.id)
    return {
        'poll': poll,
        'form': form,
        'options': options,
        'ballot': ballot,
    }

@permission_required('application.can_manage_application')
def permit_version(request, aversion_id):
    aversion = AVersion.objects.get(pk=aversion_id)
    application = aversion.application
    if request.method == 'POST':
        application.accept_version(aversion)
        messages.success(request, _("Version <b>%s</b> accepted.") % (aversion.aid))
    else:
        gen_confirm_form(request, _('Do you really want to permit version <b>%s</b>?') % aversion.aid, reverse('application_version_permit', args=[aversion.id]))
    return redirect(reverse('application_view', args=[application.id]))


@permission_required('application.can_manage_application')
def reject_version(request, aversion_id):
    aversion = AVersion.objects.get(pk=aversion_id)
    application = aversion.application
    if request.method == 'POST':
        if application.reject_version(aversion):
            messages.success(request, _("Version <b>%s</b> rejected.") % (aversion.aid))
        else:
            messages.error(request, _("ERROR by rejecting the version.") )
    else:
        gen_confirm_form(request, _('Do you really want to reject version <b>%s</b>?') % aversion.aid, reverse('application_version_reject', args=[aversion.id]))
    return redirect(reverse('application_view', args=[application.id]))

@permission_required('application.can_manage_applications')
@template('application/import.html')
def application_import(request):
    try:
        request.user.profile
        messages.error(request, _('The import function is available for the superuser (without user profile) only.'))
        return redirect(reverse('application_overview'))
    except Profile.DoesNotExist:
        pass
    except AttributeError:
        # AnonymousUser
        pass

    if request.method == 'POST':
        form = ApplicationImportForm(request.POST, request.FILES)
        if form.is_valid():
            try:
                users_generated = 0
                applications_generated = 0
                applications_modified = 0
                with transaction.commit_on_success():
                    for (lno, line) in enumerate(csv.reader(request.FILES['csvfile'])):
                        # basic input verification
                        if lno < 1:
                            continue
                        try:
                            (number, title, text, reason, first_name, last_name) = line[:6]
                        except ValueError:
                            messages.error(request, _('Ignoring malformed line %d in import file.') % (lno + 1))
                            continue
                        form = ApplicationForm({ 'title':title, 'text':text, 'reason':reason })
                        if not form.is_valid():
                            messages.error(request, _('Ignoring malformed line %d in import file.') % (lno + 1))
                            continue
                        if number:
                            try:
                                number = abs(long(number))
                                if number < 1:
                                    messages.error(request, _('Ignoring malformed line %d in import file.') % (lno + 1))
                                    continue
                            except ValueError:
                                messages.error(request, _('Ignoring malformed line %d in import file.') % (lno + 1))
                                continue
                        # fetch existing users or create new users as needed
                        try:
                            user = User.objects.get(first_name=first_name, last_name=last_name)
                        except User.DoesNotExist:
                            user = None
                        if user is None:
                            user = User()
                            user.last_name = last_name
                            user.first_name = first_name
                            user.username = gen_username(first_name, last_name)
                            user.save()
                            profile = Profile()
                            profile.user = user
                            profile.group = ''
                            profile.committee = ''
                            profile.gender = 'none'
                            profile.type = 'guest'
                            profile.firstpassword = gen_password()
                            profile.user.set_password(profile.firstpassword)
                            profile.save()
                            users_generated += 1
                        # create / modify the application
                        application = None
                        if number:
                            try:
                                application = Application.objects.get(number=number)
                                applications_modified += 1
                            except Application.DoesNotExist:
                                application = None
                        if application is None:
                            application = Application(submitter=user)
                            if number:
                                application.number = number
                            applications_generated += 1

                        application.title = form.cleaned_data['title']
                        application.text = form.cleaned_data['text']
                        application.reason = form.cleaned_data['reason']
                        application.save(user, trivial_change=True)

                if applications_generated:
                    messages.success(request, ungettext('%d application was successfully imported.',
                                                '%d applications were successfully imported.', applications_generated) % applications_generated)
                if applications_modified:
                    messages.success(request, ungettext('%d application was successfully modified.',
                                                '%d applications were successfully modified.', applications_modified) % applications_modified)
                if users_generated:
                    messages.success(request, ungettext('%d new user was added.', '%d new users were added.', users_generated) % users_generated)
                return redirect(reverse('application_overview'))

            except csv.Error:
                message.error(request, _('Import aborted because of severe errors in the input file.'))
        else:
            messages.error(request, _('Please check the form for errors.'))
    else:
        messages.warning(request, _("Attention: Existing applications will be modified if you import new applications with the same number."))
        messages.warning(request, _("Attention: Importing an application without a number multiple times will create duplicates."))
        form = ApplicationImportForm()
    return {
        'form': form,
    }


