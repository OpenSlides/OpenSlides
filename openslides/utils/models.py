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
    def get_collection_name(cls):
        """
        Returns the name of the collection.

        This is usualy the name of the django app and the name of the model
        combined with a slash.

        The collection_name is used to identify an object inside of
        openslides. For example in the rest api or in the search.
        """
        return "{app_name}/{model_name}".format(
            app_name=cls._meta.app_label,
            model_name=cls._meta.model_name)
