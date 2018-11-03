from typing import TYPE_CHECKING, Any, Dict, Generator, List, Optional, Type

from asgiref.sync import async_to_sync
from django.apps import apps
from django.db.models import Model
from mypy_extensions import TypedDict

from .cache import element_cache


if TYPE_CHECKING:
    from .access_permissions import BaseAccessPermissions


AutoupdateFormat = TypedDict(
    'AutoupdateFormat',
    {
        'changed': Dict[str, List[Dict[str, Any]]],
        'deleted': Dict[str, List[int]],
        'from_change_id': int,
        'to_change_id': int,
        'all_data': bool,
    },
)


class CollectionElement:
    def __init__(self, instance: Model = None, deleted: bool = False, collection_string: str = None,
                 id: int = None, full_data: Dict[str, Any] = None) -> None:
        """
        Do not use this. Use the methods from_instance() or from_values().
        """
        self.instance = instance
        self.deleted = deleted
        self.full_data = full_data
        if instance is not None:
            # Collection element is created via instance
            self.collection_string = instance.get_collection_string()
            self.id = instance.pk
        elif collection_string is not None and id is not None:
            # Collection element is created via values
            self.collection_string = collection_string
            self.id = id
        else:
            raise RuntimeError(
                'Invalid state. Use CollectionElement.from_instance() or '
                'CollectionElement.from_values() but not CollectionElement() '
                'directly.')

        if not self.deleted:
            self.get_full_data()  # This raises DoesNotExist, if the element does not exist.

    @classmethod
    def from_instance(
            cls, instance: Model, deleted: bool = False) -> 'CollectionElement':
        """
        Returns a collection element from a database instance.

        This will also update the instance in the cache.

        If deleted is set to True, the element is deleted from the cache.
        """
        return cls(instance=instance, deleted=deleted)

    @classmethod
    def from_values(cls, collection_string: str, id: int, deleted: bool = False,
                    full_data: Dict[str, Any] = None) -> 'CollectionElement':
        """
        Returns a collection element from a collection_string and an id.

        If deleted is set to True, the element is deleted from the cache.

        With the argument full_data, the content of the CollectionElement can be set.
        It has to be a dict in the format that is used be access_permission.get_full_data().
        """
        return cls(collection_string=collection_string, id=id, deleted=deleted, full_data=full_data)

    def __eq__(self, collection_element: 'CollectionElement') -> bool:  # type: ignore
        """
        Compares two collection_elements.

        Two collection elements are equal, if they have the same collection_string
        and id.
        """
        return (self.collection_string == collection_element.collection_string and
                self.id == collection_element.id)

    def get_model(self) -> Type[Model]:
        """
        Returns the django model that is used for this collection.
        """
        return get_model_from_collection_string(self.collection_string)

    def get_access_permissions(self) -> 'BaseAccessPermissions':
        """
        Returns the get_access_permissions object for the this collection element.
        """
        return self.get_model().get_access_permissions()

    def get_full_data(self) -> Dict[str, Any]:
        """
        Returns the full_data of this collection_element from with all other
        dics can be generated.

        Raises a DoesNotExist error on the requested the coresponding model, if
        the object does neither exist in the cache nor in the database.
        """
        # If the full_data is already loaded, return it
        # If there is a db_instance, use it to get the full_data
        # else: use the cache.
        if self.full_data is None:
            if self.instance is None:
                # The type of data has to be set for mypy
                data: Optional[Dict[str, Any]] = None
                data = async_to_sync(element_cache.get_element_full_data)(self.collection_string, self.id)
                if data is None:
                    raise self.get_model().DoesNotExist(
                        "Collection {} with id {} does not exist".format(self.collection_string, self.id))
                self.full_data = data
            else:
                self.full_data = self.get_access_permissions().get_full_data(self.instance)
        return self.full_data

    def is_deleted(self) -> bool:
        """
        Returns Ture if the item is marked as deleted.
        """
        return self.deleted


_models_to_collection_string: Dict[str, Type[Model]] = {}


def get_model_from_collection_string(collection_string: str) -> Type[Model]:
    """
    Returns a model class which belongs to the argument collection_string.
    """
    def model_generator() -> Generator[Type[Model], None, None]:
        """
        Yields all models of all apps.
        """
        for app_config in apps.get_app_configs():
            for model in app_config.get_models():
                yield model

    # On the first run, generate the dict. It can not change at runtime.
    if not _models_to_collection_string:
        for model in model_generator():
            try:
                get_collection_string = model.get_collection_string
            except AttributeError:
                # Skip models which do not have the method get_collection_string.
                pass
            else:
                _models_to_collection_string[get_collection_string()] = model
    try:
        model = _models_to_collection_string[collection_string]
    except KeyError:
        raise ValueError('Invalid message. A valid collection_string is missing. Got {}'.format(collection_string))
    return model
