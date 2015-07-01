import re
from urllib.parse import urlparse

from rest_framework.decorators import detail_route, list_route  # noqa
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
from rest_framework.viewsets import GenericViewSet as _GenericViewSet  # noqa
from rest_framework.viewsets import ModelViewSet as _ModelViewSet  # noqa
from rest_framework.viewsets import \
    ReadOnlyModelViewSet as _ReadOnlyModelViewSet  # noqa
from rest_framework.viewsets import ViewSet as _ViewSet  # noqa

from .exceptions import OpenSlidesError

router = DefaultRouter()


class PermissionMixin:
    """
    Mixin for subclasses of APIView like GenericViewSet and ModelViewSet.

    The methods check_view_permissions or check_projector_requirements are
    evaluated. If both return False self.permission_denied() is called.
    Django REST framework's permission system is disabled.
    """

    def get_permissions(self):
        """
        Overriden method to check view and projector permissions. Returns an
        empty interable so Django REST framework won't do any other
        permission checks by evaluating Django REST framework style permission
        classes  and the request passes.
        """
        if not self.check_view_permissions() and not self.check_projector_requirements():
            self.permission_denied(self.request)
        return ()

    def check_view_permissions(self):
        """
        Override this and return True if the requesting user should be able to
        get access to your view.
        """
        return False

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


class GenericViewSet(PermissionMixin, _GenericViewSet):
    pass


class ModelViewSet(PermissionMixin, _ModelViewSet):
    pass


class ReadOnlyModelViewSet(PermissionMixin, _ReadOnlyModelViewSet):
    pass


class ViewSet(PermissionMixin, _ViewSet):
    pass


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
