#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.core.views
    ~~~~~~~~~~~~~~~~~~~~~

    Views for the core app.

    :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.conf import settings
from django.utils.importlib import import_module

from openslides import get_version, get_git_commit_id, RELEASE
from openslides.utils.views import TemplateView
from .signals import config_signal


class VersionView(TemplateView):
    """
    Show version infos.
    """
    template_name = 'core/version.html'

    def get_context_data(self, **kwargs):
        """
        Adds version strings to the context.
        """
        context = super(VersionView, self).get_context_data(**kwargs)

        # OpenSlides version. During development the git commit id is added.
        openslides_version_string = get_version()
        if not RELEASE:
            openslides_version_string += ' Commit: %s' % get_git_commit_id()
        context['versions'] = [('OpenSlides', openslides_version_string)]

        # collect other config pages
        config_pages_list = []
        for receiver, config_page in config_signal.send(sender=self):
            if config_page.is_shown():
                config_pages_list.append({'config_page': config_page})
        context['config_pages_list'] = sorted(config_pages_list, key=lambda config_page_dict: config_page_dict['config_page'].weight)

        # Versions of plugins.
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
