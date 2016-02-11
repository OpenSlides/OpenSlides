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
    Mixin for Django models which are used in our REST API.
    """

    access_permissions = None

    def get_root_rest_element(self):
        """
        Returns the root rest instance.

        Uses self as default.
        """
        return self

    def get_access_permissions(self):
        """
        Returns a container to handle access permissions for this model and
        its corresponding viewset.
        """
        return self.access_permissions

    @classmethod
    def get_collection_string(cls):
        """
        Returns the string representing the name of the collection. Returns
        None if this is not a so called root rest instance.
        """
        # TODO Check if this is a root rest element class and return None if not.
        return '/'.join((cls._meta.app_label.lower(), cls._meta.object_name.lower()))

    def get_rest_pk(self):
        """
        Returns the primary key used in the REST API. By default this is
        the database pk.
        """
        return self.pk
