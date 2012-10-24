#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.config.views
    ~~~~~~~~~~~~~~~~~~~~~~~

    Views for the config app.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.conf import settings
from django.contrib import messages
from django.contrib.auth.models import Group, Permission
from django.core.urlresolvers import reverse
from django.utils.importlib import import_module
from django.utils.translation import ugettext as _

from openslides import get_version

from openslides.utils.template import Tab
from openslides.utils.views import FormView, TemplateView

from openslides.config.forms import GeneralConfigForm
from openslides.config.models import config


class GeneralConfig(FormView):
    """
    Gereral config values.
    """
    permission_required = 'config.can_manage_config'
    form_class = GeneralConfigForm
    template_name = 'config/general.html'

    def get_initial(self):
        return {
            'event_name': config['event_name'],
            'event_description': config['event_description'],
            'event_date': config['event_date'],
            'event_location': config['event_location'],
            'event_organizer': config['event_organizer'],
            'frontpage_title': config['frontpage_title'],
            'frontpage_welcometext': config['frontpage_welcometext'],
            'system_enable_anonymous': config['system_enable_anonymous'],
        }

    def form_valid(self, form):
        # event
        config['event_name'] = form.cleaned_data['event_name']
        config['event_description'] = form.cleaned_data['event_description']
        config['event_date'] = form.cleaned_data['event_date']
        config['event_location'] = form.cleaned_data['event_location']
        config['event_organizer'] = form.cleaned_data['event_organizer']

        # frontpage
        config['frontpage_title'] = form.cleaned_data['frontpage_title']
        config['frontpage_welcometext'] = \
            form.cleaned_data['frontpage_welcometext']

        # system
        if form.cleaned_data['system_enable_anonymous']:
            config['system_enable_anonymous'] = True
            # check for Anonymous group and (re)create it as needed
            try:
                anonymous = Group.objects.get(name='Anonymous')
            except Group.DoesNotExist:
                default_perms = [u'can_see_agenda', u'can_see_projector',
                    u'can_see_motion', u'can_see_assignment']
                anonymous = Group()
                anonymous.name = 'Anonymous'
                anonymous.save()
                anonymous.permissions = Permission.objects.filter(
                    codename__in=default_perms)
                anonymous.save()
                messages.success(self.request,
                    _('Anonymous access enabled. Please modify the "Anonymous" ' \
                    'group to fit your required permissions.'))
        else:
            config['system_enable_anonymous'] = False

        messages.success(self.request,
            _('General settings successfully saved.'))
        return super(GeneralConfig, self).form_valid(form)


class VersionConfig(TemplateView):
    """
    Show version infos.
    """
    permission_required = 'config.can_manage_config'
    template_name = 'config/version.html'

    def get_context_data(self, **kwargs):
        context = super(VersionConfig, self).get_context_data(**kwargs)
        context['versions'] = [('OpenSlides', get_version())]
        for plugin in settings.INSTALLED_PLUGINS:
            try:
                mod = import_module(plugin)
                plugin_version = get_version(mod.VERSION)
            except (ImportError, AttributeError, AssertionError):
                continue
            try:
                plugin_name = mod.NAME
            except AttributeError:
                plugin_name = mod.__name__.split('.')[0]

            context['versions'].append((plugin_name, plugin_version))
        return context


def register_tab(request):
    """
    Register the config tab.
    """
    selected = request.path.startswith('/config/')
    return Tab(
        title=_('Configuration'),
        url=reverse('config_general'),
        permission=request.user.has_perm('config.can_manage_config'),
        selected=selected,
    )
