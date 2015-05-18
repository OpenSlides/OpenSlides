import re

from urllib.parse import urlparse

from django.core.urlresolvers import reverse
from rest_framework.decorators import detail_route  # noqa
from rest_framework.serializers import (  # noqa
    CharField,
    IntegerField,
    ListSerializer,
    ModelSerializer,
    PrimaryKeyRelatedField,
    RelatedField,
    SerializerMethodField,
    ValidationError)
from rest_framework.response import Response  # noqa
from rest_framework.routers import DefaultRouter
from rest_framework.viewsets import ModelViewSet, ViewSet  # noqa
from rest_framework.decorators import list_route  # noqa

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
