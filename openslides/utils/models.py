from typing import Any, Dict, List, Optional

from django.core.exceptions import ImproperlyConfigured
from django.db import models

from .access_permissions import BaseAccessPermissions
from .utils import convert_camel_case_to_pseudo_snake_case


class MinMaxIntegerField(models.IntegerField):
    """
    IntegerField with options to set a min- and a max-value.
    """

    def __init__(self, min_value: int = None, max_value: int = None, *args: Any, **kwargs: Any) -> None:
        self.min_value, self.max_value = min_value, max_value
        super(MinMaxIntegerField, self).__init__(*args, **kwargs)

    def formfield(self, **kwargs: Any) -> Any:
        defaults = {'min_value': self.min_value, 'max_value': self.max_value}
        defaults.update(kwargs)
        return super(MinMaxIntegerField, self).formfield(**defaults)


class RESTModelMixin:
    """
    Mixin for Django models which are used in our REST API.
    """

    access_permissions: Optional[BaseAccessPermissions] = None

    def get_root_rest_element(self) -> models.Model:
        """
        Returns the root rest instance.

        Uses self as default.
        """
        return self

    @classmethod
    def get_access_permissions(cls) -> BaseAccessPermissions:
        """
        Returns a container to handle access permissions for this model and
        its corresponding viewset.
        """
        if cls.access_permissions is None:
            raise ImproperlyConfigured("A RESTModel needs to have an access_permission.")
        return cls.access_permissions

    @classmethod
    def get_collection_string(cls) -> str:
        """
        Returns the string representing the name of the collection. Returns
        None if this is not a so called root rest instance.
        """
        # TODO Check if this is a root rest element class and return None if not.
        app_label = cls._meta.app_label  # type: ignore
        object_name = cls._meta.object_name  # type: ignore
        return '/'.join(
            (convert_camel_case_to_pseudo_snake_case(app_label),
             convert_camel_case_to_pseudo_snake_case(object_name)))

    def get_rest_pk(self) -> int:
        """
        Returns the primary key used in the REST API. By default this is
        the database pk.
        """
        return self.pk  # type: ignore

    def save(self, skip_autoupdate: bool = False, *args: Any, **kwargs: Any) -> Any:
        """
        Calls Django's save() method and afterwards hits the autoupdate system.

        If skip_autoupdate is set to True, then the autoupdate system is not
        informed about the model changed. This also means, that the model cache
        is not updated. You have to do this manually by calling
        inform_changed_data().
        """
        # We don't know how to fix this circular import
        from .autoupdate import inform_changed_data
        return_value = super().save(*args, **kwargs)  # type: ignore
        if not skip_autoupdate:
            inform_changed_data(self.get_root_rest_element())
        return return_value

    def delete(self, skip_autoupdate: bool = False, *args: Any, **kwargs: Any) -> Any:
        """
        Calls Django's delete() method and afterwards hits the autoupdate system.

        If skip_autoupdate is set to True, then the autoupdate system is not
        informed about the model changed. This also means, that the model cache
        is not updated. You have to do this manually by calling
        inform_deleted_data().
        """
        # We don't know how to fix this circular import
        from .autoupdate import inform_changed_data, inform_deleted_data
        instance_pk = self.pk  # type: ignore
        return_value = super().delete(*args, **kwargs)  # type: ignore
        if not skip_autoupdate:
            if self != self.get_root_rest_element():
                # The deletion of a included element is a change of the root element.
                inform_changed_data(self.get_root_rest_element())
            else:
                inform_deleted_data([(self.get_collection_string(), instance_pk)])
        return return_value

    @classmethod
    def get_elements(cls) -> List[Dict[str, Any]]:
        """
        Returns all elements as full_data.
        """
        # Get the query to receive all data from the database.
        try:
            query = cls.objects.get_full_queryset()  # type: ignore
        except AttributeError:
            # If the model des not have to method get_full_queryset(), then use
            # the default queryset from django.
            query = cls.objects  # type: ignore

        # Build a dict from the instance id to the full_data
        return [instance.get_full_data() for instance in query.all()]

    @classmethod
    async def restrict_elements(
            cls,
            user_id: int,
            elements: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Converts a list of elements from full_data to restricted_data.
        """
        return await cls.get_access_permissions().get_restricted_data(elements, user_id)

    def get_full_data(self) -> Dict[str, Any]:
        """
        Returns the full_data of the instance.
        """
        return self.get_access_permissions().get_full_data(self)
