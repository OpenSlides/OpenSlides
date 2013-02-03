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
from django.core.urlresolvers import reverse
from django.utils.importlib import import_module
from django.utils.translation import ugettext as _

from openslides import get_version, get_git_commit_id, RELEASE
from openslides.utils.template import Tab
from openslides.utils.views import FormView, TemplateView
from .forms import GeneralConfigForm
from .models import config

# TODO: Do not import the participant module in config
from openslides.participant.api import get_or_create_anonymous_group


class GeneralConfig(FormView):
    """
    Gereral config values.
    """
    permission_required = 'config.can_manage_config'
    form_class = GeneralConfigForm
    template_name = 'config/general.html'
    success_url_name = 'config_general'

    def get_initial(self):
        return {
            'event_name': config['event_name'],
            'event_description': config['event_description'],
            'event_date': config['event_date'],
            'event_location': config['event_location'],
            'event_organizer': config['event_organizer'],
            'welcome_title': config['welcome_title'],
            'welcome_text': config['welcome_text'],
            'system_enable_anonymous': config['system_enable_anonymous'],
        }

    def form_valid(self, form):
        # event
        config['event_name'] = form.cleaned_data['event_name']
        config['event_description'] = form.cleaned_data['event_description']
        config['event_date'] = form.cleaned_data['event_date']
        config['event_location'] = form.cleaned_data['event_location']
        config['event_organizer'] = form.cleaned_data['event_organizer']

        # welcome widget
        config['welcome_title'] = form.cleaned_data['welcome_title']
        config['welcome_text'] = form.cleaned_data['welcome_text']

        # system
        if form.cleaned_data['system_enable_anonymous']:
            config['system_enable_anonymous'] = True
            get_or_create_anonymous_group()
        else:
            config['system_enable_anonymous'] = False

        messages.success(
            self.request, _('General settings successfully saved.'))
        return super(GeneralConfig, self).form_valid(form)


class VersionConfig(TemplateView):
    """
    Show version infos.
    """
    permission_required = 'config.can_manage_config'
    template_name = 'config/version.html'

    def get_context_data(self, **kwargs):
        context = super(VersionConfig, self).get_context_data(**kwargs)

        # OpenSlides version. During development the git commit id is added.
        openslides_version_string = get_version()
        if not RELEASE:
            openslides_version_string += ' Commit: %s' % get_git_commit_id()
        context['versions'] = [('OpenSlides', openslides_version_string)]

        # Version of plugins.
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
        app='config',
        url=reverse('config_general'),
        permission=request.user.has_perm('config.can_manage_config'),
        selected=selected,
    )
