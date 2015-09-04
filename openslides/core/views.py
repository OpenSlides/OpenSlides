import re
from collections import OrderedDict
from operator import attrgetter

from django.apps import apps
from django.conf import settings
from django.contrib.staticfiles import finders
from django.core.urlresolvers import get_resolver
from django.http import Http404, HttpResponse

from openslides import __version__ as version
from openslides.utils import views as utils_views
from openslides.utils.plugins import (
    get_plugin_description,
    get_plugin_verbose_name,
    get_plugin_version,
)
from openslides.utils.rest_api import (
    ModelViewSet,
    ReadOnlyModelViewSet,
    Response,
    SimpleMetadata,
    ValidationError,
    ViewSet,
    detail_route,
)

from .config import config
from .exceptions import ConfigError, ConfigNotFound
from .models import CustomSlide, Projector, Tag
from .serializers import (
    CustomSlideSerializer,
    ProjectorSerializer,
    TagSerializer,
)


# Special Django views

class IndexView(utils_views.CSRFMixin, utils_views.View):
    """
    The primary view for OpenSlides using AngularJS.

    The default base template is 'openslides/core/static/templates/index.html'.
    You can override it by simply adding a custom 'templates/index.html' file
    to the custom staticfiles directory. See STATICFILES_DIRS in settings.py.
    """

    def get(self, *args, **kwargs):
        with open(finders.find('templates/index.html')) as f:
            content = f.read()
        return HttpResponse(content)


class ProjectorView(utils_views.View):
    """
    Access the projector.
    """

    def get(self, *args, **kwargs):
        with open(finders.find('templates/projector.html')) as f:
            content = f.read()
        return HttpResponse(content)


class AppsJsView(utils_views.View):
    """
    Returns javascript code to be called in the angular app.

    The javascript code loads all js-files defined by the installed (django)
    apps and creates the angular modules for each angular app.
    """
    def get(self, *args, **kwargs):
        angular_modules = []
        js_files = []
        for app_config in apps.get_app_configs():
            # Add the angular app, if the module has one.
            if getattr(app_config,
                       'angular_{}_module'.format(kwargs.get('openslides_app')),
                       False):
                angular_modules.append('OpenSlidesApp.{app_name}.{app}'.format(
                    app=kwargs.get('openslides_app'),
                    app_name=app_config.label))

            # Add all js files that the module needs
            try:
                app_js_files = app_config.js_files
            except AttributeError:
                # The app needs no js-files
                pass
            else:
                js_files += [
                    '{static}{path}'.format(
                        static=settings.STATIC_URL,
                        path=path)
                    for path in app_js_files]
        # Use javascript loadScript function from
        # http://balpha.de/2011/10/jquery-script-insertion-and-its-consequences-for-debugging/
        return HttpResponse(
            """
            var loadScript = function (path) {
                var result = $.Deferred(),
                    script = document.createElement("script");
                script.async = "async";
                script.type = "text/javascript";
                script.src = path;
                script.onload = script.onreadystatechange = function(_, isAbort) {
                    if (!script.readyState || /loaded|complete/.test(script.readyState)) {
                        if (isAbort)
                            result.reject();
                        else
                            result.resolve();
                    }
                };
                script.onerror = function () { result.reject(); };
                $("head")[0].appendChild(script);
                return result.promise();
            };
            """ +
            "angular.module('OpenSlidesApp.{app}', {angular_modules});"
            "var deferres = [];"
            "{js_files}.forEach(function(js_file)deferres.push(loadScript(js_file)));"
            "$.when.apply(this,deferres).done(function()angular.bootstrap(document,['OpenSlidesApp.{app}']));"
            .format(
                app=kwargs.get('openslides_app'),
                angular_modules=angular_modules,
                js_files=js_files))


# Viewsets for the REST API

class ProjectorViewSet(ReadOnlyModelViewSet):
    """
    API endpoint for the projector slide info.

    There are the following views: list, retrieve, activate_elements,
    prune_elements, deactivate_elements and clear_elements
    """
    queryset = Projector.objects.all()
    serializer_class = ProjectorSerializer

    def check_view_permissions(self):
        """
        Returns True if the user has required permissions.
        """
        if self.action in ('list', 'retrieve'):
            result = self.request.user.has_perm('core.can_see_projector')
        elif self.action in ('activate_elements', 'prune_elements',
                             'deactivate_elements', 'clear_elements'):
            result = (self.request.user.has_perm('core.can_see_projector') and
                      self.request.user.has_perm('core.can_manage_projector'))
        else:
            result = False
        return result

    @detail_route(methods=['post'])
    def activate_elements(self, request, pk):
        """
        REST API operation to activate projector elements. It expects a POST
        request to /rest/core/projector/<pk>/activate_elements/ with a list
        of dictionaries to append to the projector config entry.
        """
        # Get config entry from projector model, add new elements and try to
        # serialize. This raises ValidationErrors if the data is invalid.
        projector_instance = self.get_object()
        projector_config = projector_instance.config
        for projector_element in request.data:
            projector_config.append(projector_element)
        serializer = self.get_serializer(projector_instance, data={'config': projector_config}, partial=False)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @detail_route(methods=['post'])
    def prune_elements(self, request, pk):
        """
        REST API operation to activate projector elements. It expects a POST
        request to /rest/core/projector/<pk>/prune_elements/ with a list of
        dictionaries to write them to the projector config entry. All old
        entries are deleted but not entries with stable == True.
        """
        # Get config entry from projector model, delete old and add new
        # elements and try to serialize. This raises ValidationErrors if the
        # data is invalid. Do not filter 'stable' elements.
        projector_instance = self.get_object()
        projector_config = [element for element in projector_instance.config if element.get('stable')]
        projector_config.extend(request.data)
        serializer = self.get_serializer(projector_instance, data={'config': projector_config}, partial=False)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @detail_route(methods=['post'])
    def deactivate_elements(self, request, pk):
        """
        REST API operation to deactivate projector elements. It expects a
        POST request to /rest/core/projector/<pk>/deactivate_elements/ with
        a list of dictionaries. These are exactly the projector_elements in
        the config that should be deleted.
        """
        # Check the data. It must be a list of dictionaries. Get config
        # entry from projector model. Pop out the entries that should be
        # deleted and try to serialize. This raises ValidationErrors if the
        # data is invalid.
        if not isinstance(request.data, list) or list(filter(lambda item: not isinstance(item, dict), request.data)):
            raise ValidationError({'config': ['Data must be a list of dictionaries.']})

        projector_instance = self.get_object()
        projector_config = projector_instance.config
        for entry_to_be_deleted in request.data:
            try:
                projector_config.remove(entry_to_be_deleted)
            except ValueError:
                # The entry that should be deleted is not on the projector.
                pass
        serializer = self.get_serializer(projector_instance, data={'config': projector_config}, partial=False)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @detail_route(methods=['post'])
    def clear_elements(self, request, pk):
        """
        REST API operation to deactivate all projector elements but not
        entries with stable == True. It expects a POST request to
        /rest/core/projector/<pk>/clear_elements/.
        """
        # Get config entry from projector model. Then clear the config field
        # and try to serialize. Do not remove 'stable' elements.
        projector_instance = self.get_object()
        projector_config = [element for element in projector_instance.config if element.get('stable')]
        serializer = self.get_serializer(projector_instance, data={'config': projector_config}, partial=False)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class CustomSlideViewSet(ModelViewSet):
    """
    API endpoint for custom slides.

    There are the following views: metadata, list, retrieve, create,
    partial_update, update and destroy.
    """
    queryset = CustomSlide.objects.all()
    serializer_class = CustomSlideSerializer

    def check_view_permissions(self):
        """
        Returns True if the user has required permissions.
        """
        return self.request.user.has_perm('core.can_manage_projector')


class TagViewSet(ModelViewSet):
    """
    API endpoint for tags.

    There are the following views: metadata, list, retrieve, create,
    partial_update, update and destroy.
    """
    queryset = Tag.objects.all()
    serializer_class = TagSerializer

    def check_view_permissions(self):
        """
        Returns True if the user has required permissions.
        """
        if self.action in ('metadata', 'list', 'retrieve'):
            # Every authenticated user can see the metadata and list or
            # retrieve tags. Anonymous users can do so if they are enabled.
            result = self.request.user.is_authenticated() or config['general_system_enable_anonymous']
        elif self.action in ('create', 'update', 'destroy'):
            result = self.request.user.has_perm('core.can_manage_tags')
        else:
            result = False
        return result


class ConfigMetadata(SimpleMetadata):
    """
    Custom metadata class to add config info to responses on OPTIONS requests.
    """
    def determine_metadata(self, request, view):
        # Sort config variables by weight.
        config_variables = sorted(config.get_config_variables().values(), key=attrgetter('weight'))

        # Build tree.
        config_groups = []
        for config_variable in config_variables:
            if not config_groups or config_groups[-1]['name'] != config_variable.group:
                config_groups.append(OrderedDict(
                    name=config_variable.group,
                    subgroups=[]))
            if not config_groups[-1]['subgroups'] or config_groups[-1]['subgroups'][-1]['name'] != config_variable.subgroup:
                config_groups[-1]['subgroups'].append(OrderedDict(
                    name=config_variable.subgroup,
                    items=[]))
            config_groups[-1]['subgroups'][-1]['items'].append(config_variable.data)

        # Add tree to metadata.
        metadata = super().determine_metadata(request, view)
        metadata['config_groups'] = config_groups
        return metadata


class ConfigViewSet(ViewSet):
    """
    API endpoint for the config.

    There are the following views: metadata, list, retrieve and update.
    """
    metadata_class = ConfigMetadata

    def check_view_permissions(self):
        """
        Returns True if the user has required permissions.
        """
        if self.action in ('metadata', 'list', 'retrieve'):
            # Every authenticated user can see the metadata and list or
            # retrieve the config. Anonymous users can do so if they are
            # enabled.
            result = self.request.user.is_authenticated() or config['general_system_enable_anonymous']
        elif self.action == 'update':
            result = self.request.user.has_perm('core.can_manage_config')
        else:
            result = False
        return result

    def list(self, request):
        """
        Lists all config variables. Everybody can see them.
        """
        return Response([{'key': key, 'value': value} for key, value in config.items()])

    def retrieve(self, request, *args, **kwargs):
        """
        Retrieves a config variable. Everybody can see it.
        """
        key = kwargs['pk']
        try:
            value = config[key]
        except ConfigNotFound:
            raise Http404
        return Response({'key': key, 'value': value})

    def update(self, request, *args, **kwargs):
        """
        Updates a config variable. Only managers can do this.

        Example: {"value": 42}
        """
        key = kwargs['pk']
        value = request.data['value']

        # Validate and change value.
        try:
            config[key] = value
        except ConfigNotFound:
            raise Http404
        except ConfigError as e:
            raise ValidationError({'detail': str(e)})

        # Return response.
        return Response({'key': key, 'value': value})


# Special API views

class UrlPatternsView(utils_views.APIView):
    """
    Returns a dictionary with all url patterns as json. The patterns kwargs
    are transformed using a colon.
    """
    URL_KWARGS_REGEX = re.compile(r'%\((\w*)\)s')
    http_method_names = ['get']

    def get_context_data(self, **context):
        result = {}
        url_dict = get_resolver(None).reverse_dict
        for pattern_name in filter(lambda key: isinstance(key, str), url_dict.keys()):
            normalized_regex_bits, p_pattern, pattern_default_args = url_dict[pattern_name]
            url, url_kwargs = normalized_regex_bits[0]
            result[pattern_name] = self.URL_KWARGS_REGEX.sub(r':\1', url)
        return result


class VersionView(utils_views.APIView):
    """
    Returns a dictionary with the OpenSlides version and the version of all
    plugins.
    """
    http_method_names = ['get']

    def get_context_data(self, **context):
        result = dict(openslides_version=version, plugins=[])
        # Versions of plugins.
        for plugin in settings.INSTALLED_PLUGINS:
            result['plugins'].append({
                'verbose_name': get_plugin_verbose_name(plugin),
                'description': get_plugin_description(plugin),
                'version': get_plugin_version(plugin)})
        return result
