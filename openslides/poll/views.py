#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.poll.views
    ~~~~~~~~~~~~~~~~~~~~~

    Views for the poll app.

    :copyright: 2011 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.shortcuts import render_to_response, redirect
from django.template import RequestContext
from django.core.urlresolvers import reverse
from django.contrib import messages
from django.utils.translation import ugettext as _

from poll.models import Poll, Option
from poll.forms import PollForm, OptionForm, OptionResultForm
from utils.utils import template, permission_required, gen_confirm_form
#from utils.pdf import print_poll


@permission_required('poll.can_view_poll')
@template('poll/overview.html')
def get_overview(request):
    query = Poll.objects.filter(assignment=None).filter(application=None)
    try:
        sort = request.GET['sort']
        if sort in ['title']:
            query = query.order_by(sort)
    except KeyError:
        pass
    if 'reverse' in request.GET:
        query = query.reverse()

    polls = query.all()
    return {
        'polls': polls,
    }


@template('poll/view.html')
@permission_required('poll.can_view_poll')
def view(request, poll_id):
    poll = Poll.objects.get(pk=poll_id)
    if poll.application and not request.path.startswith('/application'):
        return redirect(reverse('application_poll_view', args=[poll_id]))
    if poll.assignment and not request.path.startswith('/assignment'):
        return redirect(reverse('assignment_poll_view', args=[poll_id, 0]))
    if not (poll.application or poll.assignment) and not request.path.startswith('/poll'):
        return redirect(reverse('poll_view', args=[poll_id]))

    options = poll.option_set.all()
    if request.user.has_perm('poll.can_manage_poll'):
        success = 0
        for option in options:
            if request.method == 'POST':
                option.form = OptionResultForm(request.POST, prefix="o%d" % option.id)
                if option.form.is_valid():
                    option.voteyes = option.form.cleaned_data['yes']
                    option.voteno = option.form.cleaned_data['no'] or 0
                    option.voteundesided = option.form.cleaned_data['undesided'] or 0
                    option.save()
                    success = success + 1
                else:
                    messages.error(request, _('Please check the form for errors.'))
            else:
                option.form = OptionResultForm(initial={
                    'yes': option.voteyes,
                    'no': option.voteno,
                    'undesided': option.voteundesided,
                }, prefix="o%d" % option.id)
        if request.method == 'POST' and success == options.count():
            messages.success(request, _("Votes are successfully saved.") )
    
    return {
        'poll': poll,
        'options': options,
    }


@permission_required('poll.can_manage_poll')
@template('poll/edit.html')
def edit(request, poll_id=None):
    """
    View to create and edit a poll object.
    """
    if poll_id is not None:
        poll = Poll.objects.get(id=poll_id)
    else:
        poll = None

    if request.method == 'POST':
        if poll_id is None:
            form = PollForm(request.POST)
        else:
            form = PollForm(request.POST, instance=poll)

        if form.is_valid():
            poll = form.save()
            if poll_id is None:
                messages.success(request, _('New poll was successfully created.'))
            else:
                messages.success(request, _('Poll was successfully modified.'))
            return redirect(reverse("poll_overview"))
        messages.error(request, _('Please check the form for errors.'))
    else:
        if poll_id is None:
            form = PollForm()
        else:
            form = PollForm(instance=poll)
    return {
        'form': form,
        'poll': poll,
    }


@permission_required('poll.can_manage_poll')
def delete(request, poll_id):
    poll = Poll.objects.get(id=poll_id)
    if request.method == 'POST':
        poll.delete()
        messages.success(request, _('Poll <b>%s</b> was successfully deleted.') % poll)
    else:
        gen_confirm_form(request, _('Do you really want to delete <b>%s</b>?') % poll, reverse('poll_delete', args=[poll_id]))
    return redirect(reverse('poll_overview'))


@permission_required('poll.can_manage_poll')
@template('poll/option_edit.html')
def option_edit(request, poll_id=None, option_id=None):
    """
    View to create and edit options of a poll object.
    """
    if option_id is not None:
        option = Option.objects.get(id=option_id)
    else:
        option = None

    if request.method == 'POST':
        if option_id is None:
            form = OptionForm(request.POST)
        else:
            form = OptionForm(request.POST, instance=option)

        if form.is_valid():
            option = form.save()
            if option_id is None:
                messages.success(request, _('New option was successfully created.'))
            else:
                messages.success(request, _('Option was successfully modified.'))
            return redirect(reverse("poll_overview"))
        messages.error(request, _('Please check the form for errors.'))
    else:
        if option_id is None:
            if poll_id is None:
                form = OptionForm()
            else:
                poll = Poll.objects.get(id=poll_id)
                form = OptionForm(initial={'poll': poll})
        else:
            form = OptionForm(instance=option)
    return {
        'form': form,
        'option': option,
    }


@permission_required('poll.can_manage_poll')
def option_delete(request, option_id):
    option = Option.objects.get(id=option_id)
    if request.method == 'POST':
        option.delete()
        messages.success(request, _('Option <b>%s</b> was successfully deleted.') % option)
    else:
        gen_confirm_form(request, _('Do you really want to delete the option <b>%s</b>?') % option_id, reverse('option_delete', args=[option_id]))
    return redirect(reverse('poll_overview'))
