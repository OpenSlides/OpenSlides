import time
from typing import Any, Dict, List, Optional

from django.core.exceptions import ImproperlyConfigured
from django.db import models

from . import logging
from .access_permissions import BaseAccessPermissions
from .auth import UserDoesNotExist
from .autoupdate import AutoupdateElement, inform_changed_data, inform_elements
from .rest_api import model_serializer_classes
from .utils import convert_camel_case_to_pseudo_snake_case, get_element_id


logger = logging.getLogger(__name__)


class MinMaxIntegerField(models.IntegerField):
    """
    IntegerField with options to set a min- and a max-value.
    """

    def __init__(
        self, min_value: int = None, max_value: int = None, *args: Any, **kwargs: Any
    ) -> None:
        self.min_value, self.max_value = min_value, max_value
        super(MinMaxIntegerField, self).__init__(*args, **kwargs)

    def formfield(self, **kwargs: Any) -> Any:
        defaults = {"min_value": self.min_value, "max_value": self.max_value}
        defaults.update(kwargs)
        return super(MinMaxIntegerField, self).formfield(**defaults)


class RESTModelMixin:
    """
    Mixin for Django models which are used in our REST API.
    """

    access_permissions: Optional[BaseAccessPermissions] = None

    personalized_model = False
    """
    Flag, if the model is personalized on a per-user basis.
    Requires the model to have a `user_id` which should be
    a OneToOne relation to User. The relation must never change,
    because it won't be deleted from it's former user when the relation
    changes.
    """

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
            raise ImproperlyConfigured(
                "A RESTModel needs to have an access_permission."
            )
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
        return "/".join(
            (
                convert_camel_case_to_pseudo_snake_case(app_label),
                convert_camel_case_to_pseudo_snake_case(object_name),
            )
        )

    def get_rest_pk(self) -> int:
        """
        Returns the primary key used in the REST API. By default this is
        the database pk.
        """
        return self.pk  # type: ignore

    def get_element_id(self) -> str:
        return get_element_id(self.get_collection_string(), self.get_rest_pk())

    def save(
        self,
        skip_autoupdate: bool = False,
        no_delete_on_restriction: bool = False,
        *args: Any,
        **kwargs: Any,
    ) -> Any:
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
            inform_changed_data(
                self.get_root_rest_element(),
                no_delete_on_restriction=no_delete_on_restriction,
            )
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
    def get_elements(cls, ids: Optional[List[int]] = None) -> List[Dict[str, Any]]:
        """
        Returns all elements as full_data.
        """
        do_logging = not bool(ids)

        if do_logging:
            logger.info(f"Loading {cls.get_collection_string()}")
        # Get the query to receive all data from the database.
        try:
            query = cls.objects.get_prefetched_queryset(ids=ids)  # type: ignore
        except AttributeError:
            # If the model des not have to method get_prefetched_queryset(), then use
            # the default queryset from django.
            query = cls.objects  # type: ignore
            if ids:
                query = query.filter(pk__in=ids)

        # Build a dict from the instance id to the full_data
        instances = query.all()
        full_data = []

        # For logging the progress
        last_time = time.time()
        instances_length = len(instances)
        for i, instance in enumerate(instances):
            # Append full data from this instance
            full_data.append(instance.get_full_data())
            if do_logging:
                # log progress every 5 seconds
                current_time = time.time()
                if current_time > last_time + 5:
                    last_time = current_time
                    logger.info(f"    {i+1}/{instances_length}...")
        return full_data

    @classmethod
    async def restrict_elements(
        cls, user_id: int, elements: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Converts a list of elements from full_data to restricted_data.
        """
        try:
            return await cls.get_access_permissions().get_restricted_data(
                elements, user_id
            )
        except UserDoesNotExist:
            return []

    def get_full_data(self) -> Dict[str, Any]:
        """
        Returns the full_data of the instance.
        """
        try:
            serializer_class = model_serializer_classes[type(self)]
        except KeyError:
            # Because of the order of imports, it can happen, that the serializer
            # for a model is not imported yet. Try to guess the name of the
            # module and import it.
            module_name = type(self).__module__.rsplit(".", 1)[0] + ".serializers"
            __import__(module_name)
            serializer_class = model_serializer_classes[type(self)]
        return serializer_class(self).data


def SET_NULL_AND_AUTOUPDATE(
    collector: Any, field: Any, sub_objs: Any, using: Any
) -> None:
    """
    Like models.SET_NULL but also informs the autoupdate system about the
    instance that was reference.
    """
    instances = []
    for sub_obj in sub_objs:
        setattr(sub_obj, field.name, None)
        instances.append(sub_obj)
    inform_changed_data(instances)
    models.SET_NULL(collector, field, sub_objs, using)


def CASCADE_AND_AUTOUPDATE(
    collector: Any, field: Any, sub_objs: Any, using: Any
) -> None:
    """
    Like models.CASCADE but also informs the autoupdate system about the
    root rest element of the also deleted instance.
    """
    elements = []
    for sub_obj in sub_objs:
        root_rest_element = sub_obj.get_root_rest_element()
        elements.append(
            AutoupdateElement(
                collection_string=root_rest_element.get_collection_string(),
                id=root_rest_element.get_rest_pk(),
            )
        )
    inform_elements(elements)
    models.CASCADE(collector, field, sub_objs, using)
