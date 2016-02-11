from django.core.urlresolvers import reverse
from django.db import models


class MinMaxIntegerField(models.IntegerField):
    """
    IntegerField with options to set a min- and a max-value.
    """

    def __init__(self, min_value=None, max_value=None, *args, **kwargs):
        self.min_value, self.max_value = min_value, max_value
        super(MinMaxIntegerField, self).__init__(*args, **kwargs)

    def formfield(self, **kwargs):
        defaults = {'min_value': self.min_value, 'max_value': self.max_value}
        defaults.update(kwargs)
        return super(MinMaxIntegerField, self).formfield(**defaults)


class RESTModelMixin:
    """
    Mixin for django models which are used in our rest api.
    """

    access_permissions = None

    @classmethod
    def get_collection_name(cls):
        return "{0}/{1}".format(cls._meta.app_label.lower(), cls._meta.object_name.lower())

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

    def get_collection_string(self):
        """
        Returns the string representing the name of the collection.
        """
        # TODO: find a way not to use the url. See #1791
        from .rest_api import get_collection_and_id_from_url
        return get_collection_and_id_from_url(self.get_root_rest_url())[0]
