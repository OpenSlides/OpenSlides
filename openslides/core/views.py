import base64
import json
import os
import re
import uuid
from collections import OrderedDict
from operator import attrgetter
from urllib.parse import unquote

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
from openslides.utils.search import search

from .access_permissions import (
    ChatMessageAccessPermissions,
    ConfigAccessPermissions,
    CustomSlideAccessPermissions,
    ProjectorAccessPermissions,
    TagAccessPermissions,
)
from .config import config
from .exceptions import ConfigError, ConfigNotFound
from .models import ChatMessage, CustomSlide, Projector, Tag


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

    The projector container template is 'openslides/core/static/templates/projector-container.html'.
    This container is for controlling the projector resolution.
    """

    def get(self, *args, **kwargs):
        with open(finders.find('templates/projector-container.html')) as f:
            content = f.read()
        return HttpResponse(content)


class RealProjectorView(utils_views.View):
    """
    The original view without resolutioncontrol for OpenSlides projector using AngularJS.

    The default base template is 'openslides/core/static/templates/projector.html'.
    You can override it by simply adding a custom 'templates/projector.html'
    file to the custom staticfiles directory. See STATICFILES_DIRS in
    settings.py.
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
            """
            angular.module('OpenSlidesApp.{app}', {angular_modules});
            var deferres = [];
            {js_files}.forEach( function(js_file) {{ deferres.push(loadScript(js_file)); }} );
            $.when.apply(this,deferres).done(function() {{
                angular.bootstrap(document,['OpenSlidesApp.{app}']);
            }} );
            """
            .format(
                app=kwargs.get('openslides_app'),
                angular_modules=angular_modules,
                js_files=js_files))


# Viewsets for the REST API

class ProjectorViewSet(ReadOnlyModelViewSet):
    """
    API endpoint for the projector slide info.

    There are the following views: metadata, list, retrieve,
    activate_elements, prune_elements, update_elements,
    deactivate_elements, clear_elements and control_view.
    """
    access_permissions = ProjectorAccessPermissions()
    queryset = Projector.objects.all()

    def check_view_permissions(self):
        """
        Returns True if the user has required permissions.
        """
        if self.action in ('list', 'retrieve'):
            result = self.get_access_permissions().check_permissions(self.request.user)
        elif self.action == 'metadata':
            result = self.request.user.has_perm('core.can_see_projector')
        elif self.action in ('activate_elements', 'prune_elements', 'update_elements',
                             'deactivate_elements', 'clear_elements', 'control_view', 'set_resolution'):
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
            raise ValidationError({'detail': 'Data must be a list.'})

        projector_instance = self.get_object()
        projector_config = projector_instance.config
        for element in request.data:
            if element.get('name') is None:
                raise ValidationError({'detail': 'Invalid projector element. Name is missing.'})
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
            raise ValidationError({'detail': 'Data must be a list.'})

        projector_instance = self.get_object()
        projector_config = {}
        for key, value in projector_instance.config.items():
            if value.get('stable'):
                projector_config[key] = value
        for element in request.data:
            if element.get('name') is None:
                raise ValidationError({'detail': 'Invalid projector element. Name is missing.'})
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
            raise ValidationError({'detail': 'Data must be a dictionary.'})
        error = {'detail': 'Data must be a dictionary with UUIDs as keys and dictionaries as values.'}
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
                raise ValidationError({'detail': 'Invalid projector element. Wrong UUID.'})
            projector_config[key].update(request.data[key])

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
            raise ValidationError({'detail': 'Data must be a list of hex UUIDs.'})
        for item in request.data:
            try:
                uuid.UUID(hex=str(item))
            except ValueError:
                raise ValidationError({'detail': 'Data must be a list of hex UUIDs.'})

        projector_instance = self.get_object()
        projector_config = projector_instance.config
        for key in request.data:
            try:
                del projector_config[key]
            except KeyError:
                raise ValidationError({'detail': 'Invalid UUID.'})

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
    def set_resolution(self, request, pk):
        """
        REST API operation to set the resolution.

        It is actually unused, because the resolution is currently set in the config.
        But with the multiprojector feature this will become importent to set the
        resolution per projector individually.

        It expects a POST request to
        /rest/core/projector/<pk>/set_resolution/ with a dictionary with the width
        and height and the values.

        Example:

        {
            "width": "1024",
            "height": "768"
        }
        """
        if not isinstance(request.data, dict):
            raise ValidationError({'detail': 'Data must be a dictionary.'})
        if request.data.get('width') is None or request.data.get('height') is None:
            raise ValidationError({'detail': 'A width and a height have to be given.'})
        if not isinstance(request.data['width'], int) or not isinstance(request.data['height'], int):
            raise ValidationError({'detail': 'Data has to be integers.'})
        if (request.data['width'] < 800 or request.data['width'] > 3840 or
                request.data['height'] < 600 or request.data['height'] > 2160):
            raise ValidationError({'detail': 'The Resolution have to be between 800x600 and 3840x2160.'})

        projector_instance = self.get_object()
        projector_instance.width = request.data['width']
        projector_instance.height = request.data['height']
        projector_instance.save()

        message = 'Changing resolution to {width}x{height} was successful.'.format(
            width=request.data['width'],
            height=request.data['height'])
        return Response({'detail': message})

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
            raise ValidationError({'detail': 'Data must be a dictionary.'})
        if (request.data.get('action') not in ('scale', 'scroll') or
                request.data.get('direction') not in ('up', 'down', 'reset')):
            raise ValidationError({'detail': "Data must be a dictionary with an action ('scale' or 'scroll') "
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
    access_permissions = CustomSlideAccessPermissions()
    queryset = CustomSlide.objects.all()

    def check_view_permissions(self):
        """
        Returns True if the user has required permissions.
        """
        if self.action in ('list', 'retrieve'):
            result = self.get_access_permissions().check_permissions(self.request.user)
        else:
            result = self.request.user.has_perm('core.can_manage_projector')
        return result


class TagViewSet(ModelViewSet):
    """
    API endpoint for tags.

    There are the following views: metadata, list, retrieve, create,
    partial_update, update and destroy.
    """
    access_permissions = TagAccessPermissions()
    queryset = Tag.objects.all()

    def check_view_permissions(self):
        """
        Returns True if the user has required permissions.
        """
        if self.action in ('list', 'retrieve'):
            result = self.get_access_permissions().check_permissions(self.request.user)
        elif self.action == 'metadata':
            # Every authenticated user can see the metadata and list tags.
            # Anonymous users can do so if they are enabled.
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
        # Build tree.
        config_groups = []
        for config_variable in sorted(config.config_variables.values(), key=attrgetter('weight')):
            if config_variable.is_hidden():
                # Skip hidden config variables. Do not even check groups and subgroups.
                continue
            if not config_groups or config_groups[-1]['name'] != config_variable.group:
                # Add new group.
                config_groups.append(OrderedDict(
                    name=config_variable.group,
                    subgroups=[]))
            if not config_groups[-1]['subgroups'] or config_groups[-1]['subgroups'][-1]['name'] != config_variable.subgroup:
                # Add new subgroup.
                config_groups[-1]['subgroups'].append(OrderedDict(
                    name=config_variable.subgroup,
                    items=[]))
            # Add the config variable to the current group and subgroup.
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
    access_permissions = ConfigAccessPermissions()
    metadata_class = ConfigMetadata

    def check_view_permissions(self):
        """
        Returns True if the user has required permissions.
        """
        if self.action in ('list', 'retrieve'):
            result = self.get_access_permissions().check_permissions(self.request.user)
        elif self.action == 'metadata':
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
        # Attention: The format of this response has to be the same as in
        # the get_full_data method of ConfigAccessPermissions.
        return Response({'key': key, 'value': value})

    def update(self, request, *args, **kwargs):
        """
        Updates a config variable. Only managers can do this.

        Example: {"value": 42}
        """
        key = kwargs['pk']
        value = request.data.get('value')
        if value is None:
            raise ValidationError({'detail': 'Invalid input. Config value is missing.'})

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
    access_permissions = ChatMessageAccessPermissions()
    queryset = ChatMessage.objects.all()

    def check_view_permissions(self):
        """
        Returns True if the user has required permissions.
        """
        if self.action in ('list', 'retrieve'):
            result = self.get_access_permissions().check_permissions(self.request.user)
        else:
            # We do not want anonymous users to use the chat even the anonymous
            # group has the permission core.can_use_chat.
            result = (
                self.action in ('metadata', 'create') and
                self.request.user.is_authenticated() and
                self.request.user.has_perm('core.can_use_chat'))
        return result

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


class SearchView(utils_views.APIView):
    """
    Accepts a search string and returns a list of objects where each object
    is a dictonary with the keywords collection and id.

    This view expects a get argument 'q' with a search string.

    See: https://pythonhosted.org/Whoosh/querylang.html for the format of the
    search string.
    """
    http_method_names = ['get']

    def get_context_data(self, **context):
        query = self.request.GET.get('q', '')
        return super().get_context_data(
            elements=search(unquote(query)),
            **context)


class MediaEncoder(utils_views.APIView):
    """
    MediaEncoder is a class based view to prepare encoded media for pdfMake
    """
    http_method_names = ['post']

    def post(self, request, *args, **kwargs):
        """
        Encode_image is used in the context of PDF-Generation
        Takes an array of IMG.src - Paths
        Retrieves the according images
        Encodes the images to BASE64
        Add configured fonts
        Puts it into a key-value structure

        {
            "images": {
                "media/file/ubuntu.png":"$ENCODED_IMAGE"
            },
            "fonts": [{
                        $FontName : {
                                        normal: $Filename
                                        bold: $Filename
                                        italics: $Filename
                                        bolditalics: $Filename
                                    }
            }],
            "default_font": "$DEFAULTFONT"
        }

        :param request:
        :return: Response of the resulting dictionary

        Calling e.g.
        $.ajax({ type: "POST", url: "/motions/encode_images/",
                data: JSON.stringify(["$FILEPATH"]),
                success: function(data){ console.log(data); },
                dataType: 'application/json' });
        """
        body_unicode = request.body.decode('utf-8')
        file_paths = json.loads(body_unicode)
        images = {file_path: self.encode_image_from(file_path) for file_path in file_paths}
        fonts = self.encoded_fonts()
        default_font = self.get_default_font()
        return Response({
            "images": images,
            "fonts": fonts,
            "defaultFont": default_font
        })

    def get_default_font(self):
        """
        Returns the default font for pdfMake.

        Note: For development purposes this is hard coded.

        :return: the name of the default Font
        """
        return 'OpenSans'

    def encoded_fonts(self):
        """
        Generate font encoding for pdfMake
        :return: list of Font Encodings
        """
        fonts = self.get_configured_fonts()
        enc_fonts = [self.encode_font(name, files) for name, files in fonts.items()]
        return enc_fonts

    def get_configured_fonts(self):
        """
        Returns the configured fonts

        Note: For development purposes, the current font definition is hard coded

        The form is {
            $FontName : {
                normal: $Filename
                bold: $Filename
                italics: $Filename
                bolditalics: $Filename
            }
        }
        This structure is required according to PDFMake specs.
        :return:
        """
        fonts = {
            'OpenSans': {
                'normal': 'OpenSans-Regular.ttf',
                'bold': 'OpenSans-Bold.ttf',
                'italics': 'OpenSans-Italic.ttf',
                'bolditalics': 'OpenSans-BoldItalic.ttf'
            }
        }
        return fonts

    def encode_font(self, font_name, font_files):
        """
        Responsible to encode a single font
        :param fontName: name of the font
        :param font_files: files for different weighs
        :return: dictionary with encoded font
        """
        encoded_files = {type: self.encode_font_from(file_path) for type, file_path in font_files.items()}
        return {font_name: encoded_files}

    def encode_font_from(self, file_path):
        """
        Returns the BASE64 encoded version of an image-file for a given path
        :param file_path:
        :return: dictionary with the string representation (content) and the name of the file
        for the pdfMake.vfs structure
        """
        path = os.path.join(settings.MODULE_DIR, 'static', 'fonts', os.path.basename(file_path))
        try:
            with open(path, "rb") as file:
                string_representation = "{}".format(base64.b64encode(file.read()).decode())
        except:
            return ""
        else:
            return {"content": string_representation, "name": file_path}

    def encode_image_from(self, file_path):
        """
        Returns the BASE64 encoded version of an image-file for a given path
        :param file_path:
        :return:
        """
        path = os.path.join(settings.MEDIA_ROOT, 'file', os.path.basename(file_path))
        try:
            with open(path, "rb") as file:
                string_representation = "data:image/{};base64,{}".format(os.path.splitext(file_path)[1][1:],
                                                                         base64.b64encode(file.read()).decode())
        except Exception:
            # If any error occurs ignore it and return an empty string
            return ""
        else:
            return string_representation
