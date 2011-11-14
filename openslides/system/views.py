#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.system.views
    ~~~~~~~~~~~~~~~~~~~~~~~

    Views for the system app.

    :copyright: 2011 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.shortcuts import redirect
from django.core.urlresolvers import reverse
from django.contrib import messages
from django.contrib.auth.models import Group, Permission
from django.utils.translation import ugettext as _
from utils.utils import template
from utils.utils import template, permission_required
from system.forms import SystemConfigForm, EventConfigForm, AgendaConfigForm, ApplicationConfigForm, AssignmentConfigForm
from system.api import config_get, config_set

@permission_required('system.can_manage_system')
@template('system/general.html')
def get_general_config(request):
    if request.method == 'POST':
        form_event = EventConfigForm(request.POST, prefix='event')
        if form_event.is_valid():
            # event form
            config_set('event_name', form_event.cleaned_data['event_name'])
            config_set('event_description', form_event.cleaned_data['event_description'])
            config_set('event_date', form_event.cleaned_data['event_date'])
            config_set('event_location', form_event.cleaned_data['event_location'])
            config_set('event_organizer', form_event.cleaned_data['event_organizer'])
            messages.success(request, _('General settings successfully saved.'))
        else:
            messages.error(request, _('Please check the form for errors.'))
    else:
        form_event = EventConfigForm(initial={
            'event_name': config_get('event_name'),
        }, prefix='event')
    return {
        'form_event': form_event,
    }

@permission_required('system.can_manage_system')
@template('system/agenda.html')
def get_agenda_config(request):
    if request.method == 'POST':
        form_agenda = AgendaConfigForm(request.POST, prefix='agenda')
        if form_agenda.is_valid():
            config_set('agenda_countdown_time', form_agenda.cleaned_data['agenda_countdown_time'])
            messages.success(request, _('Agenda settings successfully saved.'))
        else:
            messages.error(request, _('Please check the form for errors.'))
    else:
        form_agenda = AgendaConfigForm(initial={
            'agenda_countdown_time': config_get('agenda_countdown_time'),
        }, prefix='agenda')
    return {
        'form_agenda': form_agenda,
    }

@permission_required('system.can_manage_system')
@template('system/application.html')
def get_application_config(request):
    if request.method == 'POST':
        form_application = ApplicationConfigForm(request.POST, prefix='application')
        form_assignment = AssignmentConfigForm(request.POST, prefix='assignment')
        if form_application.is_valid():
            config_set('application_min_supporters', form_application.cleaned_data['application_min_supporters'])
            config_set('application_preamble', form_application.cleaned_data['application_preamble'])
            config_set('application_pdf_ballot_papers_selection', form_application.cleaned_data['application_pdf_ballot_papers_selection'])
            config_set('application_pdf_ballot_papers_number', form_application.cleaned_data['application_pdf_ballot_papers_number'])
            config_set('application_pdf_title', form_application.cleaned_data['application_pdf_title'])
            config_set('application_pdf_preamble', form_application.cleaned_data['application_pdf_preamble'])
            messages.success(request, _('Application settings successfully saved.'))
        else:
            messages.error(request, _('Please check the form for errors.'))
    else:
        form_application = ApplicationConfigForm(initial={
            'application_min_supporters': config_get('application_min_supporters'),
            'application_preamble': config_get('application_preamble'),
            'application_pdf_ballot_papers_selection': config_get('application_pdf_ballot_papers_selection'),
            'application_pdf_ballot_papers_number': config_get('application_pdf_ballot_papers_number'),
            'application_pdf_title': config_get('application_pdf_title'),
            'application_pdf_preamble': config_get('application_pdf_preamble'),
        }, prefix='application')
    return {
        'form_application': form_application,
    }

@permission_required('system.can_manage_system')
@template('system/assignment.html')
def get_assignment_config(request):
    if request.method == 'POST':
        form_assignment = AssignmentConfigForm(request.POST, prefix='assignment')
        if form_assignment.is_valid():
            config_set('assignment_pdf_ballot_papers_selection', form_assignment.cleaned_data['assignment_pdf_ballot_papers_selection'])
            config_set('assignment_pdf_ballot_papers_number', form_assignment.cleaned_data['assignment_pdf_ballot_papers_number'])
            config_set('assignment_pdf_title', form_assignment.cleaned_data['assignment_pdf_title'])
            config_set('assignment_pdf_preamble', form_assignment.cleaned_data['assignment_pdf_preamble'])
            messages.success(request, _('Election settings successfully saved.'))
        else:
            messages.error(request, _('Please check the form for errors.'))
    else:
        form_assignment = AssignmentConfigForm(initial={
            'assignment_pdf_ballot_papers_selection': config_get('assignment_pdf_ballot_papers_selection'),
            'assignment_pdf_ballot_papers_number': config_get('assignment_pdf_ballot_papers_number'),
            'assignment_pdf_title': config_get('assignment_pdf_title'),
            'assignment_pdf_preamble': config_get('assignment_pdf_preamble'),
        }, prefix='assignment')
    return {
        'form_assignment': form_assignment,
    }

@permission_required('system.can_manage_system')
@template('system/system.html')
def get_system_config(request):
    if request.method == 'POST':
        form = SystemConfigForm(request.POST)
        if form.is_valid():
            config_set('system_url', form.cleaned_data['system_url'])
            config_set('system_welcometext', form.cleaned_data['system_welcometext'])
            if form.cleaned_data['system_enable_anonymous']:
                config_set('system_enable_anonymous', True)
                # check for Anonymous group and (re)create it as needed
                try:
                    anonymous = Group.objects.get(name='Anonymous')
                except Group.DoesNotExist:
                    default_perms = [u'can_see_agenda', u'can_see_projector', u'can_see_application']
                    anonymous = Group()
                    anonymous.name = 'Anonymous'
                    anonymous.save()
                    anonymous.permissions = Permission.objects.filter(codename__in=default_perms)
                    anonymous.save()
                messages.success(request, _('Anonymous access enabled. Please modify the "Anonymous" group to fit your required permissions.'))
            else:
                # use '' - False will evaluate to uniced(False) => True..
                config_set('system_enable_anonymous', '')
            messages.success(request, _('System settings successfully saved.'))
        else:
            messages.error(request, _('Please check the form for errors.'))
    else:
        form = SystemConfigForm(initial={
            'system_url': config_get('system_url'),
            'system_welcometext': config_get('system_welcometext'),
            'system_enable_anonymous': config_get('system_enable_anonymous'),
        })
    return {
        'form': form,
    }
