from django.core.urlresolvers import reverse
from rest_framework import permissions, routers, serializers, viewsets  # noqa

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
