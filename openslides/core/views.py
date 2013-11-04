# -*- coding: utf-8 -*-

from django.conf import settings
from django.core.exceptions import PermissionDenied
from django.utils.importlib import import_module
from haystack.views import SearchView as _SearchView

from openslides import get_git_commit_id, get_version, RELEASE
from openslides.config.api import config
from openslides.utils.signals import template_manipulation
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


class SearchView(_SearchView):
    """
    Shows search result page.
    """
    template = 'core/search.html'

    def __call__(self, request):
        if not request.user.is_authenticated() and not config['system_enable_anonymous']:
            raise PermissionDenied
        return super(SearchView, self).__call__(request)

    def extra_context(self):
        """
        Adds extra context variables to set navigation and search filter.

        Returns a context dictionary.
        """
        context = {}
        template_manipulation.send(
            sender=self.__class__, request=self.request, context=context)
        context['models'] = self.get_indexed_searchmodels()
        context['get_values'] = self.request.GET.getlist('models')
        return context

    def get_indexed_searchmodels(self):
        """
        Iterate over all INSTALLED_APPS and return a list of models which are
        indexed by haystack/whoosh for using in customized model search filter
        in search template search.html. Each list entry contains a verbose name
        of the model and a special form field value for haystack (app_name.model_name),
        e.g. ['Agenda', 'agenda.item'].
        """
        models = []
        # TODO: cache this query!
        for app in settings.INSTALLED_APPS:
            try:
                module = import_module(app + '.search_indexes')
            except ImportError:
                pass
            else:
                models.append([module.Index.modelfilter_name, module.Index.modelfilter_value])
        return models
