#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.assignment.views
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Views for the assignment app.

    :copyright: 2011 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.shortcuts import redirect
from django.core.urlresolvers import reverse
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.utils.translation import ugettext as _

from openslides.agenda.models import Item
from poll.models import Poll, Option
from poll.forms import OptionResultForm, PollForm
from assignment.models import Assignment
from assignment.forms import AssignmentForm, AssignmentRunForm
from utils.utils import template, permission_required, gen_confirm_form, del_confirm_form, ajax_request
from utils.pdf import print_assignment, print_assignment_poll
from participant.models import Profile


@permission_required('assignment.can_see_assignment')
@template('assignment/overview.html')
def get_overview(request):
    query = Assignment.objects
    if 'status' in request.GET and '---' not in request.GET['status']:
        query = query.filter(status__iexact=request.GET['status'])
    try:
        sort = request.GET['sort']
        if sort in ['name','status']:
            query = query.order_by(sort)
    except KeyError:
        query = query.order_by('name')
    if 'reverse' in request.GET:
        query = query.reverse()

    assignments = query.all()
    return {
        'assignments': assignments,
    }


@permission_required('assignment.can_see_assignment')
@template('assignment/view.html')
def view(request, assignment_id=None):
    form = None
    assignment = Assignment.objects.get(pk=assignment_id)
    if request.method == 'POST':
        if request.user.has_perm('assignment.can_nominate_other'):
            form = AssignmentRunForm(request.POST)
            if form.is_valid():
                user = form.cleaned_data['candidate']
                try:
                    assignment.run(user)
                    messages.success(request, _("Candidate <b>%s</b> was nominated successfully.") % (user))
                except NameError, e:
                    messages.error(request, e)
    else:
        if request.user.has_perm('assignment.can_nominate_other'):
            form = AssignmentRunForm()

    votes = []
    for candidate in assignment.candidates:
        tmplist = [[candidate, assignment.is_elected(candidate)], []]
        for poll in assignment.poll_set.all():
            if (poll.published and not request.user.has_perm('assignment.can_manage_assignment')) or request.user.has_perm('assignment.can_manage_assignment'):
                if candidate in poll.options_values:
                    option = Option.objects.filter(poll=poll).filter(user=candidate)[0]
                    if poll.optiondecision:
                        tmplist[1].append([option.yes, option.no, option.undesided])
                    else:
                        tmplist[1].append(option.yes)
                else:
                    tmplist[1].append("-")
        votes.append(tmplist)

    polls = []
    for poll in assignment.poll_set.filter(assignment=assignment):
        polls.append(poll)

    return {'assignment': assignment,
            'form': form,
            'votes': votes,
            'polls': polls }


@permission_required('assignment.can_manage_assignment')
@template('assignment/edit.html')
def edit(request, assignment_id=None):
    """
    View zum editieren und neuanlegen von Wahlen
    """
    if assignment_id is not None:
        assignment = Assignment.objects.get(id=assignment_id)
    else:
        assignment = None

    if request.method == 'POST':
        form = AssignmentForm(request.POST, instance=assignment)
        if form.is_valid():
            assignment = form.save()
            if assignment_id is None:
                messages.success(request, _('New election was successfully created.'))
            else:
                messages.success(request, _('Election was successfully modified.'))
            if not 'apply' in request.POST:
                return redirect(reverse("assignment_overview"))
            if assignment_id is None:
                return redirect(reverse('assignment_edit', args=[assignment.id]))
    else:
        form = AssignmentForm(instance=assignment)
    return {
        'form': form,
        'assignment': assignment,
    }


@permission_required('assignment.can_manage_assignment')
def delete(request, assignment_id):
    assignment = Assignment.objects.get(pk=assignment_id)
    if request.method == 'POST':
        assignment.delete()
        messages.success(request, _('Election <b>%s</b> was successfully deleted.') % assignment)
    else:
        del_confirm_form(request, assignment)
    return redirect(reverse('assignment_overview'))


@permission_required('assignment.can_manage_assignment')
@template('assignment/view.html')
def set_status(request, assignment_id=None, status=None):
    try:
        if status is not None:
            assignment = Assignment.objects.get(pk=assignment_id)
            assignment.set_status(status)
            messages.success(request, _('Election status was set to: <b>%s</b>.') % assignment.get_status_display())
    except Assignment.DoesNotExist:
        pass
    return redirect(reverse('assignment_view', args=[assignment_id]))


@permission_required('assignment.can_nominate_self')
def run(request, assignment_id):
    assignment = Assignment.objects.get(pk=assignment_id)
    try:
        assignment.run(request.user.profile)
        messages.success(request, _('You have set your candidature successfully.') )
    except NameError, e:
        messages.error(request, e)
    except Profile.DoesNotExist:
        messages.error(request,
                       _("You can't candidate. Your user account is only for administration."))
    return redirect(reverse('assignment_view', args=assignment_id))


@login_required
def delrun(request, assignment_id):
    assignment = Assignment.objects.get(pk=assignment_id)
    assignment.delrun(request.user.profile)
    messages.success(request, _("You have withdrawn your candidature successfully.") )
    return redirect(reverse('assignment_view', args=assignment_id))


@permission_required('assignment.can_manage_assignment')
def delother(request, assignment_id, profile_id):
    assignment = Assignment.objects.get(pk=assignment_id)
    profile = Profile.objects.get(pk=profile_id)

    if request.method == 'POST':
        assignment.delrun(profile)
        messages.success(request, _("Candidate <b>%s</b> was withdrawn successfully.") % (profile))
    else:
        gen_confirm_form(request,
                       _("Do you really want to withdraw <b>%s</b> from the election?") \
                        % profile, reverse('assignment_delother', args=[assignment_id, profile_id]))
    return redirect(reverse('assignment_view', args=assignment_id))


@permission_required('assignment.can_manage_application')
def set_active(request, assignment_id):
    item = Item.objects.get(itemassignment__assignment__id=assignment_id)
    item.set_active(False)
    return redirect(reverse('assignment_view', args=[assignment_id]))

@permission_required('assignment.can_manage_assignment')
def gen_poll(request, assignment_id):
    try:
        poll = Assignment.objects.get(pk=assignment_id).gen_poll()
        messages.success(request, _("New ballot was successfully created.") )
    except Assignment.DoesNotExist:
        pass
    return redirect(reverse('assignment_poll_view', args=[poll.id]))


@permission_required('assignment.can_manage_assignment')
@template('assignment/poll_view.html')
def poll_view(request, poll_id):
    poll = Poll.objects.get(pk=poll_id)
    ballotnumber = poll.ballot
    options = poll.options.order_by('user__user__first_name')
    assignment = poll.assignment
    if request.user.has_perm('assignment.can_manage_assignment'):
        if request.method == 'POST':
            form = PollForm(request.POST, prefix="poll")
            if form.is_valid():
                poll.votesinvalid = form.cleaned_data['invalid'] or 0
                poll.votescast = form.cleaned_data['votescast'] or 0
                poll.save()

            success = 0
            for option in options:
                option.form = OptionResultForm(request.POST, prefix="o%d" % option.id)
                if option.form.is_valid():
                    option.voteyes = option.form.cleaned_data['yes']
                    option.voteno = option.form.cleaned_data['no'] or 0
                    option.voteundesided = option.form.cleaned_data['undesided'] or 0
                    option.save()
                    success = success + 1
            if success == options.count():
                messages.success(request, _("Votes are successfully saved.") )
            if not 'apply' in request.POST:
               return redirect(reverse('assignment_view', args=[assignment.id]))
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
        'ballotnumber': ballotnumber,
    }

@permission_required('assignment.can_manage_assignment')
def set_published(request, poll_id, published=True):
    try:
        poll = Poll.objects.get(pk=poll_id)
        poll.set_published(published)
        if poll.published:
            messages.success(request, _("Poll successfully set to published.") )
        else:
            messages.success(request, _("Poll successfully set to unpublished.") )
    except Poll.DoesNotExist:
        messages.error(request, _('Poll ID %d does not exist.') % int(poll_id))
    return redirect(reverse('assignment_view', args=[poll.assignment.id]))

@permission_required('assignment.can_manage_assignment')
def delete_poll(request, poll_id):
    poll = Poll.objects.get(pk=poll_id)
    assignment = poll.assignment
    ballot = assignment.poll_set.filter(id__lte=poll_id).count()
    if request.method == 'POST':
        poll.delete()
        messages.success(request, _('The %s. ballot was successfully deleted.') % ballot)
    else:
        del_confirm_form(request, poll, name=_("the %s. ballot") % ballot)
    return redirect(reverse('assignment_view', args=[assignment.id]))

@permission_required('assignment.can_manage_assignment')
def set_elected(request, assignment_id, profile_id, elected=True):
    assignment = Assignment.objects.get(pk=assignment_id)
    profile = Profile.objects.get(pk=profile_id)
    assignment.set_elected(profile, elected)

    if request.is_ajax():
        if elected:
            link = reverse('assignment_user_not_elected', args=[assignment.id, profile.id])
            text = _('not elected')
        else:
            link = reverse('assignment_user_elected', args=[assignment.id, profile.id])
            text = _('elected')
        return ajax_request({'elected': elected,
                             'link': link,
                             'text': text})

    return redirect(reverse('assignment_view', args=[assignment_id]))
