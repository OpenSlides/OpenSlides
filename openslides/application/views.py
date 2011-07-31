#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.application.views
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Views for the application app.

    :copyright: 2011 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.shortcuts import redirect
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.core.urlresolvers import reverse
from django.utils.translation import ugettext as _

from openslides.application.models import Application
from openslides.application.forms import ApplicationForm, \
                                         ApplicationManagerForm
from openslides.poll.models import Poll
from openslides.poll.forms import OptionResultForm, PollInvalidForm
from openslides.utils.utils import template, permission_required, \
                                   render_to_forbitten, del_confirm_form
from openslides.utils.pdf import print_application, print_application_poll
from openslides.system.api import config_get


@permission_required('application.can_view_application')
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


@permission_required('application.can_view_application')
@template('application/view.html')
def view(request, application_id):
    """
    View one application.
    """
    application = Application.objects.get(pk=application_id)
    revisions = application.versions
    actions = application.get_allowed_actions(user=request.user)

    return {
        'application': application,
        'revisions': revisions,
        'actions': actions,
        'min_supporters': int(config_get('application_min_supporters')),
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
    and not request.user.has_perm('application.can_insert_application'):
        messages.error(request, _("You have not the necessary rights to edit or insert applications."))
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
            if is_manager:
                application = managerform.save()
            elif application_id is None:
                application = Application(submitter=request.user)
            application.title = dataform.cleaned_data['title']
            application.text = dataform.cleaned_data['text']
            application.reason = dataform.cleaned_data['reason']
            application.save(request.user)
            if application_id is None:
                messages.success(request, _('New application was successfully created.'))
            else:
                messages.success(request, _('Application was successfully modified.'))
            return redirect(reverse('application_view', args=[application.id]))
    else:
        if application_id is None:
            initial = {'text': config_get('application_preamble')}
        else:
            if application.status == "pub" and application.supporter.count() > 0:
                if request.user.has_perm('application.can_manage_applications'):
                    messages.warning(request, _("Attention: Do you really want to edit this application? The supporters will not be removed automatically. Please check if the supports are valid after your changing."))
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
@template('application/view.html')
def gen_poll(request, application_id):
    """
    gen a poll for this application.
    """
    try:
        count = Poll.objects.filter(application=application_id).count()
        Application.objects.get(pk=application_id).gen_poll(user=request.user, pollcount=count+1)
        messages.success(request, _("New poll was successfully created.") )
    except Application.DoesNotExist:
        pass
    return redirect(reverse('application_view', args=[application_id]))


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


@permission_required('application.can_view_poll')
@template('application/poll_view.html')
def view_poll(request, poll_id):
    """
    view a poll for this application.
    """
    poll = Poll.objects.get(pk=poll_id)
    options = poll.options
    if request.user.has_perm('application.can_manage_applications'):
        if request.method == 'POST':
            form = PollInvalidForm(request.POST, prefix="poll")
            if form.is_valid():
                poll.voteinvalid = form.cleaned_data['invalid'] or 0
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
        else:
            form = PollInvalidForm(initial={'invalid': poll.voteinvalid}, prefix="poll")
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
    }
