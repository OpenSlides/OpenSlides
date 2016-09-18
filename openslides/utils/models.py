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

    @classmethod
    def get_access_permissions(cls):
        """
        Returns a container to handle access permissions for this model and
        its corresponding viewset.
        """
        return cls.access_permissions

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

    def save(self, skip_autoupdate=False, information=None, *args, **kwargs):
        """
        Calls the django save-method and afterwards hits the autoupdate system.

        If skip_autoupdate is set to True, then the autoupdate system is not
        informed about the model changed. This also means, that the model cache
        is not updated.

        The optional argument information can be an object that is given to the
        autoupdate system. It should be a dict.
        """
        # TODO: Fix circular imports
        from .autoupdate import inform_changed_data
        return_value = super().save(*args, **kwargs)
        inform_changed_data(self.get_root_rest_element(), information=information)
        return return_value

    def delete(self, skip_autoupdate=False, information=None, *args, **kwargs):
        """
        Calls the django delete-method and afterwards hits the autoupdate system.

        See the save method above.
        """
        # TODO: Fix circular imports
        from .autoupdate import inform_changed_data, inform_deleted_data
        # Django sets the pk of the instance to None after deleting it. But
        # we need the pk to tell the autoupdate system which element was deleted.
        instance_pk = self.pk
        return_value = super().delete(*args, **kwargs)
        if self != self.get_root_rest_element():
            # The deletion of a included element is a change of the master
            # element.
            # TODO: Does this work in any case with self.pk = None?
            inform_changed_data(self.get_root_rest_element(), information=information)
        else:
            inform_deleted_data(self, information=information)
        return return_value
