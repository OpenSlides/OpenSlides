import re
from urllib.parse import urlparse

from django.core.urlresolvers import reverse
from rest_framework.decorators import detail_route  # noqa
from rest_framework.decorators import list_route  # noqa
from rest_framework.metadata import SimpleMetadata  # noqa
from rest_framework.mixins import DestroyModelMixin, UpdateModelMixin  # noqa
from rest_framework.response import Response  # noqa
from rest_framework.routers import DefaultRouter
from rest_framework.serializers import (  # noqa
    CharField,
    DictField,
    Field,
    IntegerField,
    ListField,
    ListSerializer,
    ModelSerializer,
    PrimaryKeyRelatedField,
    RelatedField,
    SerializerMethodField,
    ValidationError,
)
from rest_framework.viewsets import ModelViewSet as _ModelViewSet  # noqa
from rest_framework.viewsets import (  # noqa
    GenericViewSet,
    ReadOnlyModelViewSet,
    ViewSet,
)

from .exceptions import OpenSlidesError

router = DefaultRouter()


class RESTModelMixin:
    """
    Mixin for django models which are used in our rest api.
    """

    def get_root_rest_element(self):
        """
        Returns the root rest instance.

        Uses self as default.
        """
        return self

    def get_root_rest_url(self):
        """
        Returns the detail url of the root model of this object.
        """
        # Gets the default url-name in the same way as django rest framework
        # does in relations.HyperlinkedModelSerializer
        root_instance = self.get_root_rest_element()
        rest_url = '%s-detail' % type(root_instance)._meta.object_name.lower()
        return reverse(rest_url, args=[str(root_instance.pk)])


class ModelViewSet(_ModelViewSet):
    """
    Viewset for models. Before the method check_permission is called we
    check projector requirements. If access for projector client users is
    not currently required, check_permission is called, else not.
    """
    def initial(self, request, *args, **kwargs):
        """
        Runs anything that needs to occur prior to calling the method handler.
        """
        self.format_kwarg = self.get_format_suffix(**kwargs)

        # Ensure that the incoming request is permitted
        self.perform_authentication(request)
        if not self.check_projector_requirements():
            self.check_permissions(request)
        self.check_throttles(request)

        # Perform content negotiation and store the accepted info on the request
        neg = self.perform_content_negotiation(request)
        request.accepted_renderer, request.accepted_media_type = neg

    def check_projector_requirements(self):
        """
        Helper method which returns True if the current request (on this
        view instance) is required for at least one active projector element.
        """
        from openslides.core.models import Projector

        result = False
        if self.request.user.has_perm('core.can_see_projector'):
            for requirement in Projector.get_all_requirements():
                if requirement.is_currently_required(view_instance=self):
                    result = True
                    break
        return result


def get_collection_and_id_from_url(url):
    """
    Helper function. Returns a tuple containing the collection name and the id
    extracted out of the given REST api URL.

    For example get_collection_and_id_from_url('http://localhost/api/users/user/3/')
    returns ('users/user', '3').

    Raises OpenSlidesError if the URL is invalid.
    """
    path = urlparse(url).path
    match = re.match(r'^/rest/(?P<collection>[-\w]+/[-\w]+)/(?P<id>[-\w]+)/$', path)
    if not match:
        raise OpenSlidesError('Invalid REST api URL: %s' % url)
    return match.group('collection'), match.group('id')
