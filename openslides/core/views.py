import re

from django.contrib.staticfiles import finders
from django.core.urlresolvers import get_resolver
from django.http import HttpResponse

from openslides.utils import views as utils_views
from openslides.utils.rest_api import (
    ModelViewSet,
    ReadOnlyModelViewSet,
    Response,
    ValidationError,
    detail_route,
)

from .models import CustomSlide, Projector, Tag
from .serializers import (
    CustomSlideSerializer,
    ProjectorSerializer,
    TagSerializer,
)


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


class ProjectorViewSet(ReadOnlyModelViewSet):
    """
    API endpoint to list, retrieve and update the projector slide info.
    """
    queryset = Projector.objects.all()
    serializer_class = ProjectorSerializer

    def check_permissions(self, request):
        """
        Calls self.permission_denied() if the requesting user has not the
        permission to see the projector and in case of an update request the
        permission to manage the projector.
        """
        manage_methods = (
            'activate_elements',
            'prune_elements',
            'deactivate_elements',
            'clear_elements')
        if (not request.user.has_perm('core.can_see_projector') or
                (self.action in manage_methods and
                 not request.user.has_perm('core.can_manage_projector'))):
            self.permission_denied(request)

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
    API endpoint to list, retrieve, create, update and destroy custom slides.
    """
    queryset = CustomSlide.objects.all()
    serializer_class = CustomSlideSerializer

    def check_permissions(self, request):
        """
        Calls self.permission_denied() if the requesting user has not the
        permission to manage projector.
        """
        if not request.user.has_perm('core.can_manage_projector'):
            self.permission_denied(request)


class TagViewSet(ModelViewSet):
    """
    API endpoint to list, retrieve, create, update and destroy tags.
    """
    queryset = Tag.objects.all()
    serializer_class = TagSerializer

    def check_permissions(self, request):
        """
        Calls self.permission_denied() if the requesting user has not the
        permission to manage tags and it is a create, update or detroy request.
        Users without permissions are able to list and retrieve tags.
        """
        if (self.action in ('create', 'update', 'destroy') and
                not request.user.has_perm('core.can_manage_tags')):
            self.permission_denied(request)


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
