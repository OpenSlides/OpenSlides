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
from django.utils.translation import ugettext as _
from utils.utils import template
from utils.utils import template, permission_required
from system.forms import SystemConfigForm, EventConfigForm, ApplicationConfigForm
from system.api import config_get, config_set

@permission_required('system.can_manage_system')
@template('system/system.html')
def get_system_config(request):
    if request.method == 'POST':
        form = SystemConfigForm(request.POST)
        if form.is_valid():
            config_set('user_registration', form.cleaned_data['user_registration'])
            messages.success(request, _('System settings successfully saved.'))
        else:
            messages.error(request, _('Please check the form for errors.'))

    else:
        form = SystemConfigForm(initial={
            'user_registration': config_get('user_registration'),
        })
    return {
        'form': form,
    }

@permission_required('system.can_manage_system')
@template('system/general.html')
def get_general_config(request):
    if request.method == 'POST':
        form_event = EventConfigForm(request.POST, prefix='event')
        form_application = ApplicationConfigForm(request.POST, prefix='application')
        if form_event.is_valid() and form_application.is_valid():
            config_set('event_name', form_event.cleaned_data['event_name'])
            config_set('event_description', form_event.cleaned_data['event_description'])
            config_set('event_date', form_event.cleaned_data['event_date'])
            config_set('event_location', form_event.cleaned_data['event_location'])
            config_set('event_organizer', form_event.cleaned_data['event_organizer'])
            config_set('application_min_supporters', form_application.cleaned_data['application_min_supporters'])
            config_set('application_preamble', form_application.cleaned_data['application_preamble'])
            messages.success(request, _('General settings successfully saved.'))
        else:
            messages.error(request, _('Please check the form for errors.'))

    else:
        form_event = EventConfigForm(initial={
            'event_name': config_get('event_name'),
            'event_description': config_get('event_description'),
            'event_date': config_get('event_date'),
            'event_location': config_get('event_location'),
            'event_organizer': config_get('event_organizer'),
        }, prefix='event')
        form_application = ApplicationConfigForm(initial={
            'application_min_supporters': config_get('application_min_supporters'),
            'application_preamble': config_get('application_preamble'),
        }, prefix='application')
    return {
        'form_event': form_event,
        'form_application': form_application,
    }
