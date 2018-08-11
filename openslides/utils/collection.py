from typing import (
    TYPE_CHECKING,
    Any,
    Dict,
    Generator,
    Iterable,
    List,
    Optional,
    Type,
    cast,
)

from django.apps import apps
from django.db.models import Model
from mypy_extensions import TypedDict

from .cache import full_data_cache

if TYPE_CHECKING:
    from .access_permissions import BaseAccessPermissions  # noqa


AutoupdateFormat = TypedDict(
    'AutoupdateFormat',
    {
        'collection': str,
        'id': int,
        'action': 'str',
        'data': Dict[str, Any],
    },
    total=False,
)

InnerChannelMessageFormat = TypedDict(
    'InnerChannelMessageFormat',
    {
        'collection_string': str,
        'id': int,
        'deleted': bool,
        'information': Dict[str, Any],
        'full_data': Optional[Dict[str, Any]],
    }
)

ChannelMessageFormat = TypedDict(
    'ChannelMessageFormat',
    {
        'elements': List[InnerChannelMessageFormat],
    }
)


class CollectionElement:
    def __init__(self, instance: Model = None, deleted: bool = False, collection_string: str = None,
                 id: int = None, full_data: Dict[str, Any] = None, information: Dict[str, Any] = None) -> None:
        """
        Do not use this. Use the methods from_instance() or from_values().
        """
        self.instance = instance
        self.deleted = deleted
        self.full_data = full_data
        self.information = information or {}
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

        if self.is_deleted():
            # Delete the element from the cache, if self.is_deleted() is True:
            full_data_cache.del_element(self.collection_string, self.id)
        else:
            # The call to get_full_data() has some sideeffects. When the object
            # was created with from_instance() or the object is not in the cache
            # then get_full_data() will save the object into the cache.
            # This will also raise a DoesNotExist error, if the object does
            # neither exist in the cache nor in the database.
            self.get_full_data()

    @classmethod
    def from_instance(cls, instance: Model, deleted: bool = False, information: Dict[str, Any] = None) -> 'CollectionElement':
        """
        Returns a collection element from a database instance.

        This will also update the instance in the cache.

        If deleted is set to True, the element is deleted from the cache.
        """
        return cls(instance=instance, deleted=deleted, information=information)

    @classmethod
    def from_values(cls, collection_string: str, id: int, deleted: bool = False,
                    full_data: Dict[str, Any] = None, information: Dict[str, Any] = None) -> 'CollectionElement':
        """
        Returns a collection element from a collection_string and an id.

        If deleted is set to True, the element is deleted from the cache.

        With the argument full_data, the content of the CollectionElement can be set.
        It has to be a dict in the format that is used be access_permission.get_full_data().
        """
        return cls(collection_string=collection_string, id=id, deleted=deleted,
                   full_data=full_data, information=information)

    def __eq__(self, collection_element: 'CollectionElement') -> bool:  # type: ignore
        """
        Compares two collection_elements.

        Two collection elements are equal, if they have the same collection_string
        and id.
        """
        return (self.collection_string == collection_element.collection_string and
                self.id == collection_element.id)

    def as_autoupdate_for_user(self, user: Optional['CollectionElement']) -> AutoupdateFormat:
        """
        Returns a dict that can be sent through the autoupdate system for a site
        user.
        """
        if not self.is_deleted():
            restricted_data = self.get_access_permissions().get_restricted_data([self.get_full_data()], user)
            data = restricted_data[0] if restricted_data else None
        else:
            data = None

        return format_for_autoupdate(
            collection_string=self.collection_string,
            id=self.id,
            action='deleted' if self.is_deleted() else 'changed',
            data=data)

    def as_autoupdate_for_projector(self) -> AutoupdateFormat:
        """
        Returns a dict that can be sent through the autoupdate system for the
        projector.
        """
        if not self.is_deleted():
            restricted_data = self.get_access_permissions().get_projector_data([self.get_full_data()])
            data = restricted_data[0] if restricted_data else None
        else:
            data = None

        return format_for_autoupdate(
            collection_string=self.collection_string,
            id=self.id,
            action='deleted' if self.is_deleted() else 'changed',
            data=data)

    def as_dict_for_user(self, user: Optional['CollectionElement']) -> Optional[Dict[str, Any]]:
        """
        Returns a dict with the data for a user. Can be used for the rest api.

        Returns None if the user does not has the permission to see the element.
        """
        restricted_data = self.get_access_permissions().get_restricted_data([self.get_full_data()], user)
        return restricted_data[0] if restricted_data else None

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
                # Make sure the cache exists
                if not full_data_cache.exists_for_collection(self.collection_string):
                    # Build the cache if it does not exists.
                    full_data_cache.build_for_collection(self.collection_string)
                self.full_data = full_data_cache.get_element(self.collection_string, self.id)
            else:
                self.full_data = self.get_access_permissions().get_full_data(self.instance)
                full_data_cache.add_element(self.collection_string, self.id, self.full_data)
        return self.full_data

    def is_deleted(self) -> bool:
        """
        Returns Ture if the item is marked as deleted.
        """
        return self.deleted


class Collection:
    """
    Represents all elements of one collection.
    """

    def __init__(self, collection_string: str, full_data: List[Dict[str, Any]] = None) -> None:
        """
        Initiates a Collection. A collection_string has to be given. If
        full_data (a list of dictionaries) is not given the method
        get_full_data() exposes all data by iterating over all
        CollectionElements.
        """
        self.collection_string = collection_string
        self.full_data = full_data

    def get_model(self) -> Type[Model]:
        """
        Returns the django model that is used for this collection.
        """
        return get_model_from_collection_string(self.collection_string)

    def get_access_permissions(self) -> 'BaseAccessPermissions':
        """
        Returns the get_access_permissions object for the this collection.
        """
        return self.get_model().get_access_permissions()

    def element_generator(self) -> Generator[CollectionElement, None, None]:
        """
        Generator that yields all collection_elements of this collection.
        """
        for full_data in self.get_full_data():
            yield CollectionElement.from_values(
                self.collection_string,
                full_data['id'],
                full_data=full_data)

    def get_full_data(self) -> List[Dict[str, Any]]:
        """
        Returns a list of dictionaries with full_data of all collection
        elements.
        """
        if self.full_data is None:
            # Build the cache, if it does not exists.
            if not full_data_cache.exists_for_collection(self.collection_string):
                full_data_cache.build_for_collection(self.collection_string)

            self.full_data = full_data_cache.get_data(self.collection_string)
        return self.full_data

    def as_list_for_user(self, user: Optional[CollectionElement]) -> List[Dict[str, Any]]:
        """
        Returns a list of dictonaries to send them to a user, for example over
        the rest api.
        """
        return self.get_access_permissions().get_restricted_data(self.get_full_data(), user)


_models_to_collection_string = {}  # type: Dict[str, Type[Model]]


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
        raise ValueError('Invalid message. A valid collection_string is missing.')
    return model


def format_for_autoupdate(collection_string: str, id: int, action: str, data: Dict[str, Any] = None) -> AutoupdateFormat:
    """
    Returns a dict that can be used for autoupdate.
    """
    if data is None:
        # If the data is None then the action has to be deleted,
        # even when it says diffrently. This can happen when the object is not
        # deleted, but the user has no permission to see it.
        action = 'deleted'

    output = AutoupdateFormat(
        collection=collection_string,
        id=id,
        action=action,
    )

    if action != 'deleted':
        data = cast(Dict[str, Any], data)  # In this case data can not be None
        output['data'] = data

    return output


def to_channel_message(elements: Iterable[CollectionElement]) -> ChannelMessageFormat:
    """
    Converts a list of collection elements to a dict, that can be send to the
    channels system.
    """
    output = []
    for element in elements:
        output.append(InnerChannelMessageFormat(
            collection_string=element.collection_string,
            id=element.id,
            deleted=element.is_deleted(),
            information=element.information,
            full_data=element.full_data,
        ))
    return ChannelMessageFormat(elements=output)


def from_channel_message(message: ChannelMessageFormat) -> List[CollectionElement]:
    """
    Converts a list of collection elements back from a dict, that was created
    via to_channel_message.
    """
    elements = []
    for value in message['elements']:
        elements.append(CollectionElement.from_values(**value))
    return elements
