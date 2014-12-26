# -*- coding: utf-8 -*-

from django.conf import settings
from django.contrib import messages
from django.core.exceptions import PermissionDenied
from django.core.urlresolvers import reverse
from django.db import IntegrityError
from django.shortcuts import redirect, render_to_response
from django.template import RequestContext
from django.utils.importlib import import_module
from django.utils.translation import ugettext as _
from haystack.views import SearchView as _SearchView

from openslides import get_version as get_openslides_version
from openslides import get_git_commit_id, RELEASE
from openslides.config.api import config
from openslides.utils.plugins import get_plugin_description, get_plugin_verbose_name, get_plugin_version
from openslides.utils.signals import template_manipulation
from openslides.utils import views as utils_views
from openslides.utils.widgets import Widget

from .forms import SelectWidgetsForm
from .models import CustomSlide, Tag
from .exceptions import TagException


class DashboardView(utils_views.AjaxMixin, utils_views.TemplateView):
    """
    Overview over all possible slides, the overlays and a live view: the
    Dashboard of OpenSlides. This main view uses the widget api to collect all
    widgets from all apps. See openslides.utils.widgets.Widget for more details.
    """
    required_permission = 'core.can_see_dashboard'
    template_name = 'core/dashboard.html'

    def get_context_data(self, **kwargs):
        context = super(DashboardView, self).get_context_data(**kwargs)
        widgets = []
        for widget in Widget.get_all(self.request):
            if widget.is_active():
                widgets.append(widget)
                context['extra_stylefiles'].extend(widget.get_stylesheets())
                context['extra_javascript'].extend(widget.get_javascript_files())
        context['widgets'] = widgets
        return context


class SelectWidgetsView(utils_views.TemplateView):
    """
    Shows a form to select which widgets should be displayed on the own
    dashboard. The setting is saved in the session.
    """
    # TODO: Use another base view class here, e. g. a FormView
    required_permission = 'core.can_see_dashboard'
    template_name = 'core/select_widgets.html'

    def get_context_data(self, **kwargs):
        context = super(SelectWidgetsView, self).get_context_data(**kwargs)
        widgets = Widget.get_all(self.request)
        for widget in widgets:
            initial = {'widget': widget.is_active()}
            prefix = widget.name
            if self.request.method == 'POST':
                widget.form = SelectWidgetsForm(
                    self.request.POST,
                    prefix=prefix,
                    initial=initial)
            else:
                widget.form = SelectWidgetsForm(prefix=prefix, initial=initial)
        context['widgets'] = widgets
        return context

    def post(self, request, *args, **kwargs):
        """
        Activates or deactivates the widgets in a post request.
        """
        context = self.get_context_data(**kwargs)
        session_widgets = self.request.session.get('widgets', {})
        for widget in context['widgets']:
            if widget.form.is_valid():
                session_widgets[widget.name] = widget.form.cleaned_data['widget']
            else:
                messages.error(request, _('There are errors in the form.'))
                break
        else:
            self.request.session['widgets'] = session_widgets
        return redirect(reverse('core_dashboard'))


class VersionView(utils_views.TemplateView):
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


class ErrorView(utils_views.View):
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


class CustomSlideViewMixin(object):
    """
    Mixin for for CustomSlide Views.
    """
    required_permission = 'core.can_manage_projector'
    template_name = 'core/customslide_update.html'
    model = CustomSlide
    success_url_name = 'core_dashboard'
    url_name_args = []


class CustomSlideCreateView(CustomSlideViewMixin, utils_views.CreateView):
    """
    Create a custom slide.
    """
    pass


class CustomSlideUpdateView(CustomSlideViewMixin, utils_views.UpdateView):
    """
    Update a custom slide.
    """
    pass


class CustomSlideDeleteView(CustomSlideViewMixin, utils_views.DeleteView):
    """
    Delete a custom slide.
    """
    pass


class TagListView(utils_views.AjaxMixin, utils_views.ListView):
    """
    View to list and manipulate tags.

    Shows all tags when requested via a GET-request. Manipulates tags with
    POST-requests.
    """

    model = Tag
    required_permission = 'core.can_manage_tags'

    def post(self, *args, **kwargs):
        return self.ajax_get(*args, **kwargs)

    def ajax_get(self, request, *args, **kwargs):
        name, value = request.POST['name'], request.POST.get('value', None)

        # Create a new tag
        if name == 'new':
            try:
                tag = Tag.objects.create(name=value)
            except IntegrityError:
                # The name of the tag is already taken. It must be unique.
                self.error = 'Tag name is already taken'
            else:
                self.pk = tag.pk
                self.action = 'created'

        # Update an existing tag
        elif name.startswith('edit-tag-'):
            try:
                self.get_tag_queryset(name, 9).update(name=value)
            except TagException as error:
                self.error = str(error)
            except IntegrityError:
                self.error = 'Tag name is already taken'
            except Tag.DoesNotExist:
                self.error = 'Tag does not exist'
            else:
                self.action = 'updated'

        # Delete a tag
        elif name.startswith('delete-tag-'):
            try:
                self.get_tag_queryset(name, 11).delete()
            except TagException as error:
                self.error = str(error)
            except Tag.DoesNotExist:
                self.error = 'Tag does not exist'
            else:
                self.action = 'deleted'
        return super(TagListView, self).ajax_get(request, *args, **kwargs)

    def get_tag_queryset(self, name, place_in_str):
        """
        Get a django-tag-queryset from a string.

        'name' is the string in which the pk is (at the end).

        'place_in_str' is the place where to look for the pk. It has to be an int.

        Returns a Tag QuerySet or raises TagException.
        Also sets self.pk to the pk inside the name.
        """
        try:
            self.pk = int(name[place_in_str:])
        except ValueError:
            raise TagException('Invalid name in request')
        return Tag.objects.filter(pk=self.pk)

    def get_ajax_context(self, **context):
        return super(TagListView, self).get_ajax_context(
            pk=getattr(self, 'pk', None),
            action=getattr(self, 'action', None),
            error=getattr(self, 'error', None),
            **context)
