import threading
from collections import OrderedDict
from typing import Any, Dict, Iterable, List, Optional, Tuple, Union

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.conf import settings
from django.db.models import Model

from .cache import element_cache, get_element_id
from .collection import CollectionElement, to_channel_message


def to_ordered_dict(d: Optional[Dict]) -> Optional[OrderedDict]:
    """
    Little helper to hash information dict in inform_*_data.
    """
    if isinstance(d, dict):
        result: Optional[OrderedDict] = OrderedDict([(key, to_ordered_dict(d[key])) for key in sorted(d.keys())])
    else:
        result = d
    return result


def inform_changed_data(instances: Union[Iterable[Model], Model], information: Dict[str, Any] = None) -> None:
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
        collection_element = CollectionElement.from_instance(
            root_instance,
            information=information)
        key = root_instance.get_collection_string() + str(root_instance.get_rest_pk()) + str(to_ordered_dict(information))
        collection_elements[key] = collection_element

    bundle = autoupdate_bundle.get(threading.get_ident())
    if bundle is not None:
        # Put all collection elements into the autoupdate_bundle.
        bundle.update(collection_elements)
    else:
        # Send autoupdate directly
        async_to_sync(send_autoupdate)(collection_elements.values())


def inform_deleted_data(elements: Iterable[Tuple[str, int]], information: Dict[str, Any] = None) -> None:
    """
    Informs the autoupdate system and the caching system about the deletion of
    elements.

    The argument information is added to each collection element.
    """
    collection_elements: Dict[str, Any] = {}
    for element in elements:
        collection_element = CollectionElement.from_values(
            collection_string=element[0],
            id=element[1],
            deleted=True,
            information=information)
        key = element[0] + str(element[1]) + str(to_ordered_dict(information))
        collection_elements[key] = collection_element

    bundle = autoupdate_bundle.get(threading.get_ident())
    if bundle is not None:
        # Put all collection elements into the autoupdate_bundle.
        bundle.update(collection_elements)
    else:
        # Send autoupdate directly
        async_to_sync(send_autoupdate)(collection_elements.values())


def inform_data_collection_element_list(collection_elements: List[CollectionElement],
                                        information: Dict[str, Any] = None) -> None:
    """
    Informs the autoupdate system about some collection elements. This is
    used just to send some data to all users.
    """
    elements = {}
    for collection_element in collection_elements:
        key = collection_element.collection_string + str(collection_element.id) + str(to_ordered_dict(information))
        elements[key] = collection_element

    bundle = autoupdate_bundle.get(threading.get_ident())
    if bundle is not None:
        # Put all collection elements into the autoupdate_bundle.
        bundle.update(elements)
    else:
        # Send autoupdate directly
        async_to_sync(send_autoupdate)(elements.values())


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
        async_to_sync(send_autoupdate)(bundle.values())
        return response


async def send_autoupdate(collection_elements: Iterable[CollectionElement]) -> None:
    """
    Helper function, that sends collection_elements through a channel to the
    autoupdate system.

    Also updates the redis cache.

    Does nothing if collection_elements is empty.
    """
    if collection_elements:
        cache_elements: Dict[str, Optional[Dict[str, Any]]] = {}
        for element in collection_elements:
            element_id = get_element_id(element.collection_string, element.id)
            if element.is_deleted():
                cache_elements[element_id] = None
            else:
                cache_elements[element_id] = element.get_full_data()

        if not getattr(settings, 'SKIP_CACHE', False):
            # Hack for django 2.0 and channels 2.1 to stay in the same thread.
            # This is needed for the tests.
            change_id = await element_cache.change_elements(cache_elements)
        else:
            change_id = 1

        channel_layer = get_channel_layer()
        # TODO: don't await. They can be send in parallel
        await channel_layer.group_send(
            "projector",
            {
                "type": "send_data",
                "message": to_channel_message(collection_elements),
            },
        )
        await channel_layer.group_send(
            "site",
            {
                "type": "send_data",
                "change_id": change_id,
            },
        )
