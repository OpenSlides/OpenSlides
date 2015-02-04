import re

from urllib.parse import urlparse

from django.core.urlresolvers import reverse
from rest_framework import response, routers, serializers, viewsets  # noqa

from .exceptions import OpenSlidesError

router = routers.DefaultRouter()


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


def get_name_and_id_from_url(url):
    """
    Helper function. Returns a tuple containing the name and the id extracted
    out of the given REST api URL.

    For example get_name_and_id_from_url('http://localhost/api/users/user/3/')
    returns ('users/user', '3').

    Raises OpenSlidesError if the URL is invalid.
    """
    path = urlparse(url).path
    match = re.match(r'^/api/(?P<name>[-\w/]+)/(?P<id>[-\w]+)/$', path)
    if not match:
        raise OpenSlidesError('Invalid REST api URL: %s' % url)
    return match.group('name'), match.group('id')
