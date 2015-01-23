import re
from collections import OrderedDict

from urllib.parse import urlparse

from django.core.cache import cache
from django.core.urlresolvers import reverse
from rest_framework import permissions, response, routers, serializers, viewsets  # noqa
from rest_framework.response import Response

from .exceptions import OpenSlidesError
from .autoupdate import inform_changed_data

router = routers.DefaultRouter()


class ModelViewSet(viewsets.ModelViewSet):
    """
    Viewset that unses the cache.
    """
    # TODO: cache get_serializer_class() because it is now called twice and there
    #       could be db-queries in it.

    def retrieve(self, request, *args, **kwargs):
        # Try to get the data from the cache
        cache_key = self.model.get_rest_cache_key(
            self.kwargs['pk'],
            self.get_serializer_class())
        data = cache.get(cache_key)

        if data is None:
            # If the data is not in the cache then get it from the db and save it into the cache
            instance = self.get_object()
            data = self.get_serializer(instance).data
            # To cache the data, it has to be converted to OrderedDict
            data = OrderedDict(data)
            cache.set(cache_key, data)

        return Response(data)

    def list(self, request, *args, **kwargs):
        # TODO: use the cache here. Maybe be getting only the pks from the
        #       database and receiving the actual data with cache.set_many.
        #       This should still be faster.
        # This is the code from super()
        instance = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(instance)
        if page is not None:
            serializer = self.get_pagination_serializer(page)
        else:
            serializer = self.get_serializer(instance, many=True)
        return Response(serializer.data)


class RESTModelMixin:
    """
    Mixin for django models which are used in our rest api.
    """

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.changed()

    def delete(self, *args, **kwargs):
        super().delete(*args, **kwargs)
        self.changed()

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

    @classmethod
    def get_rest_cache_key(cls, pk, Serializer):
        """
        Returns the name of the key cache that should be used for this element.

        The default is: json.MODEL.PK.SERIALIZER
        E. g.: json.Assignment.5.AssignmentFullSerializer
        """
        return 'json.%s.%s.%s' % (
            cls.__name__,
            pk,
            Serializer.__name__)

    def update_rest_cache(self, root_instance=None, serializer=None):
        """
        Updates the cache.

        root_instance is the rest_root_instance to use.

        serializer is the serializer class which is used to gether the data.
        if serializer is None, all serializers for the root_instance are used.
        """
        if root_instance is None:
            root_instance = self.get_root_rest_element()

        if root_instance.pk is None:
            # Do not cache objects that are not in the database
            return

        if serializer is None:
            try:
                serializer_list = root_instance.serializers
            except AttributeError:
                # If there are no known serializers, do nothing
                return
        else:
            serializer_list = [serializer]

        for Serializer in serializer_list:
            key = type(root_instance).get_rest_cache_key(root_instance.pk, Serializer)
            data = Serializer(root_instance).data
            # To cache the data, it has to be converted to OrderedDict
            data = OrderedDict(data)
            cache.set(key, data)

    def changed(self):
        """
        Call this method if the data of the object has changed.

        This will automaticly called in save() and delete(). This has only be
        called manualy in situations, where save() is not called, for example after a
        bulk_create().
        """
        root_rest_element = self.get_root_rest_element()
        self.update_rest_cache(root_rest_element)
        inform_changed_data(root_rest_element)


def root_rest_for(model):
    """
    Decorator to mark serializers, that there are the root serializers for a
    specific model.
    """
    def decorator(serializer_class):
        try:
            model.serializers.append(serializer_class)
        except AttributeError:
            model.serializers = [serializer_class]
        return serializer_class
    return decorator


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
