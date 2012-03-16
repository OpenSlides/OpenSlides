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
from django.dispatch import receiver
from django.template.loader import render_to_string
from django.utils.importlib import import_module

from utils.utils import template, permission_required
from utils.views import FormView

from system.forms import SystemConfigForm, EventConfigForm

from openslides.utils.signals import template_manipulation

from system import config
import settings


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


@receiver(template_manipulation, dispatch_uid="system_base_system")
def set_submenu(sender, request, **kwargs):
    selected = True if request.path == reverse('config_general') else False
    menu_links = [
        (reverse('config_general'), _('General'), selected),
    ]
    for app in settings.INSTALLED_APPS:
        try:
            mod = import_module(app + '.views')
            mod.Config
        except (ImportError, AttributeError):
            continue

        appname = mod.__name__.split('.')[0]
        selected = True if reverse('config_%s' % appname) == request.path else False
        menu_links.append(
            (reverse('config_%s' % appname), _(appname.title()), selected)
        )

    kwargs['context'].update({
        'menu_links': menu_links,
    })
