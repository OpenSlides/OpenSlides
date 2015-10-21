import re
import uuid
from collections import OrderedDict
from operator import attrgetter
from textwrap import dedent

from django.apps import apps
from django.conf import settings
from django.contrib.staticfiles import finders
from django.core.urlresolvers import get_resolver
from django.db.models import F
from django.http import Http404, HttpResponse
from django.utils.timezone import now

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
from .exceptions import ConfigError, ConfigNotFound, ViewException
from .models import ChatMessage, CustomSlide, Projector, Tag
from .serializers import (
    ChatMessageSerializer,
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
    The primary view for OpenSlides projector using AngularJS.

    The default base template is 'openslides/core/static/templates/projector.html'.
    You can override it by simply adding a custom 'templates/projector.html'
    file to the custom staticfiles directory. See STATICFILES_DIRS in
    settings.py.
    """
    def get(self, *args, **kwargs):
        with open(finders.find('templates/projector.html')) as f:
            content = f.read()
        return HttpResponse(content)


class WebclientJavaScriptView(utils_views.View):
    """
    This view returns a bundle of all JavaScript files needed for the
    requested realm (site or projector). The result is not uglified.
    """
    def get(self, *args, **kwargs):
        angular_modules = []
        js_files = ['js/openslides-libs.js']
        realm = kwargs.get('realm')  # Result is 'site' or 'projector'
        for app_config in apps.get_app_configs():
            # Add the angular app if the module has one.
            if getattr(app_config, 'angular_{}_module'.format(realm), False):
                angular_modules.append('OpenSlidesApp.{app_name}.{realm}'.format(
                    app_name=app_config.label,
                    realm=realm))
            # Add all JavaScript files that the module needs.
            try:
                app_js_files = app_config.js_files
            except AttributeError:
                # The app needs no JavaScript files.
                pass
            else:
                js_files.extend(app_js_files)

        content = ''
        for js_file in js_files:
            try:
                with open(finders.find(js_file)) as f:
                    content += f.read()
            except TypeError:
                raise ViewException(
                    'Required JavaScript file {} missing. May be you forgot to '
                    'create it via gulp or one of your AppConfig class is not correct.'.format(js_file))

        content += dedent(
            """
            (function () {
            """ +
            """
            angular.module('OpenSlidesApp.{realm}', {angular_modules});
            angular.bootstrap(document,['OpenSlidesApp.{realm}']);
            """.format(realm=realm, angular_modules=angular_modules) +
            """
            }());
            """)

        return HttpResponse(content, content_type='application/javascript')


# Viewsets for the REST API

class ProjectorViewSet(ReadOnlyModelViewSet):
    """
    API endpoint for the projector slide info.

    There are the following views: metadata, list, retrieve,
    activate_elements, prune_elements, update_elements,
    deactivate_elements, clear_elements and control_view.
    """
    queryset = Projector.objects.all()
    serializer_class = ProjectorSerializer

    def check_view_permissions(self):
        """
        Returns True if the user has required permissions.
        """
        if self.action in ('metadata', 'list', 'retrieve'):
            result = self.request.user.has_perm('core.can_see_projector')
        elif self.action in ('activate_elements', 'prune_elements', 'update_elements',
                             'deactivate_elements', 'clear_elements', 'control_view'):
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
        of dictionaries to be appended to the projector config entry.
        """
        if not isinstance(request.data, list):
            raise ValidationError({'data': 'Data must be a list.'})

        projector_instance = self.get_object()
        projector_config = projector_instance.config
        for element in request.data:
            if element.get('name') is None:
                raise ValidationError({'data': 'Invalid projector element. Name is missing.'})
            projector_config[uuid.uuid4().hex] = element

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
        if not isinstance(request.data, list):
            raise ValidationError({'data': 'Data must be a list.'})

        projector_instance = self.get_object()
        projector_config = {}
        for key, value in projector_instance.config.items():
            if value.get('stable'):
                projector_config[key] = value
        for element in request.data:
            if element.get('name') is None:
                raise ValidationError({'data': 'Invalid projector element. Name is missing.'})
            projector_config[uuid.uuid4().hex] = element

        serializer = self.get_serializer(projector_instance, data={'config': projector_config}, partial=False)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @detail_route(methods=['post'])
    def update_elements(self, request, pk):
        """
        REST API operation to update projector elements. It expects a POST
        request to /rest/core/projector/<pk>/update_elements/ with a
        dictonary to update the projector config. This must be a dictionary
        with UUIDs as keys and projector element dictionaries as values.

        Example:

        {
            "191c0878cdc04abfbd64f3177a21891a": {
                "name": "core/countdown",
                "stable": true,
                "status": "running",
                "countdown_time": 1374321600.0,
                "visable": true,
                "default": 42
            }
        }
        """
        if not isinstance(request.data, dict):
            raise ValidationError({'data': 'Data must be a dictionary.'})
        error = {'data': 'Data must be a dictionary with UUIDs as keys and dictionaries as values.'}
        for key, value in request.data.items():
            try:
                uuid.UUID(hex=str(key))
            except ValueError:
                raise ValidationError(error)
            if not isinstance(value, dict):
                raise ValidationError(error)

        projector_instance = self.get_object()
        projector_config = projector_instance.config
        for key, value in request.data.items():
            if key not in projector_config:
                raise ValidationError({'data': 'Invalid projector element. Wrong UUID.'})
        projector_config.update(request.data)

        serializer = self.get_serializer(projector_instance, data={'config': projector_config}, partial=False)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @detail_route(methods=['post'])
    def deactivate_elements(self, request, pk):
        """
        REST API operation to deactivate projector elements. It expects a
        POST request to /rest/core/projector/<pk>/deactivate_elements/ with
        a list of hex UUIDs. These are the projector_elements in the config
        that should be deleted.
        """
        if not isinstance(request.data, list):
            raise ValidationError({'data': 'Data must be a list of hex UUIDs.'})
        for item in request.data:
            try:
                uuid.UUID(hex=str(item))
            except ValueError:
                raise ValidationError({'data': 'Data must be a list of hex UUIDs.'})

        projector_instance = self.get_object()
        projector_config = projector_instance.config
        for key in request.data:
            try:
                del projector_config[key]
            except KeyError:
                raise ValidationError({'data': 'Invalid UUID.'})

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
        projector_instance = self.get_object()
        projector_config = {}
        for key, value in projector_instance.config.items():
            if value.get('stable'):
                projector_config[key] = value

        serializer = self.get_serializer(projector_instance, data={'config': projector_config}, partial=False)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @detail_route(methods=['post'])
    def control_view(self, request, pk):
        """
        REST API operation to control the projector view, i. e. scale and
        scroll the projector.

        It expects a POST request to
        /rest/core/projector/<pk>/control_view/ with a dictionary with an
        action ('scale' or 'scroll') and a direction ('up', 'down' or
        'reset').

        Example:

        {
            "action": "scale",
            "direction": "up"
        }
        """
        if not isinstance(request.data, dict):
            raise ValidationError({'data': 'Data must be a dictionary.'})
        if (request.data.get('action') not in ('scale', 'scroll') or
                request.data.get('direction') not in ('up', 'down', 'reset')):
            raise ValidationError({'data': "Data must be a dictionary with an action ('scale' or 'scroll') "
                                           "and a direction ('up', 'down' or 'reset')."})

        projector_instance = self.get_object()
        if request.data['action'] == 'scale':
            if request.data['direction'] == 'up':
                projector_instance.scale = F('scale') + 1
            elif request.data['direction'] == 'down':
                projector_instance.scale = F('scale') - 1
            else:
                # request.data['direction'] == 'reset'
                projector_instance.scale = 0
        else:
            # request.data['action'] == 'scroll'
            if request.data['direction'] == 'up':
                projector_instance.scroll = F('scroll') + 1
            elif request.data['direction'] == 'down':
                projector_instance.scroll = F('scroll') - 1
            else:
                # request.data['direction'] == 'reset'
                projector_instance.scroll = 0

        projector_instance.save()
        message = '{action} {direction} was successful.'.format(
            action=request.data['action'].capitalize(),
            direction=request.data['direction'])
        return Response({'detail': message})


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


class ChatMessageViewSet(ModelViewSet):
    """
    API endpoint for chat messages.

    There are the following views: metadata, list, retrieve and create.
    The views partial_update, update and destroy are disabled.
    """
    queryset = ChatMessage.objects.all()
    serializer_class = ChatMessageSerializer

    def check_view_permissions(self):
        """
        Returns True if the user has required permissions.
        """
        # We do not want anonymous users to use the chat even the anonymous
        # group has the permission core.can_use_chat.
        return (self.action in ('metadata', 'list', 'retrieve', 'create') and
                self.request.user.is_authenticated() and
                self.request.user.has_perm('core.can_use_chat'))

    def perform_create(self, serializer):
        """
        Customized method to inject the request.user into serializer's save
        method so that the request.user can be saved into the model field.
        """
        serializer.save(user=self.request.user)


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


class ServerTime(utils_views.APIView):
    """
    Returns the server time as UNIX timestamp.
    """
    http_method_names = ['get']

    def get_context_data(self, **context):
        return now().timestamp()


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
