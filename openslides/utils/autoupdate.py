import threading
from typing import Any, Dict, Iterable, List, Optional, Tuple, Union

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models import Model

from .cache import element_cache, get_element_id
from .collection import CollectionElement


def inform_changed_data(instances: Union[Iterable[Model], Model]) -> None:
    """
    Informs the autoupdate system and the caching system about the creation or
    update of an element.

    The argument instances can be one instance or an iterable over instances.
    """
    root_instances = set()
    if not isinstance(instances, Iterable):
        instances = (instances, )

    for instance in instances:
        try:
            root_instances.add(instance.get_root_rest_element())
        except AttributeError:
            # Instance has no method get_root_rest_element. Just ignore it.
            pass

    collection_elements = {}
    for root_instance in root_instances:
        collection_element = CollectionElement.from_instance(root_instance)
        key = root_instance.get_collection_string() + str(root_instance.get_rest_pk())
        collection_elements[key] = collection_element

    bundle = autoupdate_bundle.get(threading.get_ident())
    if bundle is not None:
        # Put all collection elements into the autoupdate_bundle.
        bundle.update(collection_elements)
    else:
        # Send autoupdate directly
        handle_collection_elements(collection_elements.values())


def inform_deleted_data(elements: Iterable[Tuple[str, int]]) -> None:
    """
    Informs the autoupdate system and the caching system about the deletion of
    elements.
    """
    collection_elements: Dict[str, Any] = {}
    for element in elements:
        collection_element = CollectionElement.from_values(
            collection_string=element[0],
            id=element[1],
            deleted=True)
        key = element[0] + str(element[1])
        collection_elements[key] = collection_element

    bundle = autoupdate_bundle.get(threading.get_ident())
    if bundle is not None:
        # Put all collection elements into the autoupdate_bundle.
        bundle.update(collection_elements)
    else:
        # Send autoupdate directly
        handle_collection_elements(collection_elements.values())


def inform_data_collection_element_list(collection_elements: List[CollectionElement]) -> None:
    """
    Informs the autoupdate system about some collection elements. This is
    used just to send some data to all users.
    """
    elements = {}
    for collection_element in collection_elements:
        key = collection_element.collection_string + str(collection_element.id)
        elements[key] = collection_element

    bundle = autoupdate_bundle.get(threading.get_ident())
    if bundle is not None:
        # Put all collection elements into the autoupdate_bundle.
        bundle.update(elements)
    else:
        # Send autoupdate directly
        handle_collection_elements(elements.values())


"""
Global container for autoupdate bundles
"""
autoupdate_bundle: Dict[int, Dict[str, CollectionElement]] = {}


class AutoupdateBundleMiddleware:
    """
    Middleware to handle autoupdate bundling.
    """
    def __init__(self, get_response: Any) -> None:
        self.get_response = get_response
        # One-time configuration and initialization.

    def __call__(self, request: Any) -> Any:
        thread_id = threading.get_ident()
        autoupdate_bundle[thread_id] = {}

        response = self.get_response(request)

        bundle: Dict[str, CollectionElement] = autoupdate_bundle.pop(thread_id)
        handle_collection_elements(bundle.values())
        return response


def handle_collection_elements(collection_elements: Iterable[CollectionElement]) -> None:
    """
    Helper function, that sends collection_elements through a channel to the
    autoupdate system and updates the cache.

    Does nothing if collection_elements is empty.
    """
    async def update_cache(collection_elements: Iterable[CollectionElement]) -> int:
        """
        Async helper function to update the cache.

        Returns the change_id
        """
        cache_elements: Dict[str, Optional[Dict[str, Any]]] = {}
        for element in collection_elements:
            element_id = get_element_id(element.collection_string, element.id)
            if element.is_deleted():
                cache_elements[element_id] = None
            else:
                cache_elements[element_id] = element.get_full_data()
        return await element_cache.change_elements(cache_elements)

    async def async_handle_collection_elements(collection_elements: Iterable[CollectionElement]) -> None:
        """
        Async helper function to update cache and send autoupdate.
        """
        # Update cache
        change_id = await update_cache(collection_elements)

        # Send autoupdate
        channel_layer = get_channel_layer()
        await channel_layer.group_send(
            "autoupdate",
            {
                "type": "send_data",
                "change_id": change_id,
            },
        )

    if collection_elements:
        # TODO: Save histroy here using sync code

        # Update cache and send autoupdate
        async_to_sync(async_handle_collection_elements)(collection_elements)
