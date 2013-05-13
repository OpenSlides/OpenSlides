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


class VersionView(TemplateView):
    """
    Shows version infos.
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
            openslides_version_string += ' – Commit %s' % get_git_commit_id()
        context['versions'] = [('OpenSlides', openslides_version_string)]

        # Versions of plugins.
        for plugin in settings.INSTALLED_PLUGINS:
            # Get plugin
            try:
                mod = import_module(plugin)
            except ImportError:
                continue

            # Get version.
            try:
                plugin_version = mod.get_version()
            except AttributeError:
                try:
                    plugin_version = mod.VERSION
                except AttributeError:
                    continue

            # Get name.
            try:
                plugin_name = mod.get_name()
            except AttributeError:
                try:
                    plugin_name = mod.NAME
                except AttributeError:
                    plugin_name = mod.__name__.split('.')[0]

            context['versions'].append((plugin_name, plugin_version))

        return context
