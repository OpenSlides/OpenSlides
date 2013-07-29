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

from openslides import __version__
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
        openslides_version_string = __version__
        if openslides_version_string[-4:] == '-dev':
            try:
                git_head = open('.git/HEAD', 'r').read().rstrip()
                if git_head[:5] == 'ref: ':
                    git_commit_id = open('.git/%s' % git_head[5:], 'r').read().rstrip()
                else:
                    git_commit_id = git_head
            except IOError:
                git_commit_id = 'unknown'
            openslides_version_string += ' – Commit %s' % str(git_commit_id)
        context['versions'] = [('OpenSlides', openslides_version_string)]

        # Versions of plugins.
        for plugin in settings.INSTALLED_PLUGINS:
            # Get plugin.
            try:
                plugin_module = import_module(plugin)
            except ImportError:
                continue
            # Get version.
            try:
                plugin_version = plugin_module.__version__
            except AttributeError:
                plugin_version = 'unknown'
            # Get name.
            try:
                plugin_name = plugin_module.get_name()
            except AttributeError:
                try:
                    plugin_name = plugin_module.NAME
                except AttributeError:
                    plugin_name = plugin_module.__name__.split('.')[0]
            context['versions'].append((plugin_name, plugin_version))

        return context
