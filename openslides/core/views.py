# -*- coding: utf-8 -*-

from django.conf import settings
from django.core.exceptions import PermissionDenied
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.utils.importlib import import_module
from django.utils.translation import ugettext as _
from haystack.views import SearchView as _SearchView

from openslides import get_version as get_openslides_version
from openslides import get_git_commit_id, RELEASE
from openslides.config.api import config
from openslides.utils.plugins import get_plugin_description, get_plugin_verbose_name, get_plugin_version
from openslides.utils.signals import template_manipulation
from openslides.utils.views import TemplateView, View


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
        if RELEASE:
            description = ''
        else:
            description = 'Commit %s' % get_git_commit_id()
        context['modules'] = [{'verbose_name': 'OpenSlides',
                               'description': description,
                               'version': get_openslides_version()}]
        # Versions of plugins.
        for plugin in settings.INSTALLED_PLUGINS:
            context['modules'].append({'verbose_name': get_plugin_verbose_name(plugin),
                                       'description': get_plugin_description(plugin),
                                       'version': get_plugin_version(plugin)})
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


class ErrorView(View):
    """
    View for Http 403, 404 and 500 error pages.
    """
    status_code = None

    def dispatch(self, request, *args, **kwargs):
        http_error_strings = {
            403: {'name': _('Forbidden'),
                  'description': _('Sorry, you have no permission to see this page.'),
                  'status_code': '403'},
            404: {'name': _('Not Found'),
                  'description': _('Sorry, the requested page could not be found.'),
                  'status_code': '404'},
            500: {'name': _('Internal Server Error'),
                  'description': _('Sorry, there was an unknown error. Please contact the event manager.'),
                  'status_code': '500'}}
        context = {}
        context['http_error'] = http_error_strings[self.status_code]
        template_manipulation.send(sender=self.__class__, request=request, context=context)
        response = render_to_response(
            'core/error.html',
            context_instance=RequestContext(request, context))
        response.status_code = self.status_code
        return response
