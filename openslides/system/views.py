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
from django.template.loader import render_to_string

from utils.utils import template, permission_required
from utils.views import FormView
from utils.template import Tab

from system.forms import SystemConfigForm, EventConfigForm

from system import config


class GeneralConfig(FormView):
    permission_required = 'system.can_manage_system'
    form_class = EventConfigForm
    template_name = 'system/general.html'

    def get_initial(self):
        return {
            'event_name': config['event_name'],
            'event_description': config['event_description'],
            'event_date': config['event_date'],
            'event_location': config['event_location'],
            'event_organizer': config['event_organizer'],
        }

    def form_valid(self, form):
        config['event_name'] = form.cleaned_data['event_name']
        config['event_description'] = form.cleaned_data['event_description']
        config['event_date'] = form.cleaned_data['event_date']
        config['event_location'] = form.cleaned_data['event_location']
        config['event_organizer'] = form.cleaned_data['event_organizer']
        messages.success(self.request, _('General settings successfully saved.'))
        return super(GeneralConfig, self).form_valid(form)

    def form_invalid(self, form):
        messages.error(self.request, _('Please check the form for errors.'))
        return super(Config, self).form_invalid(form)


class Config(FormView):
    permission_required = 'system.can_manage_system'
    form_class = SystemConfigForm
    template_name = 'system/system.html'

    def get_initial(self):
        return {
        'system_url': config['system_url'],
        'system_welcometext': config['system_welcometext'],
        'system_enable_anonymous': config['system_enable_anonymous'],
        }

    def form_valid(self, form):
        config['system_url'] = form.cleaned_data['system_url']
        config['system_welcometext'] = form.cleaned_data['system_welcometext']
        if form.cleaned_data['system_enable_anonymous']:
            config['system_enable_anonymous'] = True
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
            messages.success(self.request, _('Anonymous access enabled. Please modify the "Anonymous" group to fit your required permissions.'))
        else:
            config['system_enable_anonymous'] = False
        messages.success(self.request, _('System settings successfully saved.'))
        return super(Config, self).form_valid(form)


def register_tab(request):
    selected = True if request.path.startswith('/config/') else False
    return Tab(
        title=_('Configuration'),
        url=reverse('config_general'),
        permission=request.user.has_perm('system.can_manage_system'),
        selected=selected,
    )
