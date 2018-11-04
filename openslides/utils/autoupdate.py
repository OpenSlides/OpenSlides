import threading
from typing import Any, Dict, Iterable, List, Optional, Tuple, Union

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models import Model
from mypy_extensions import TypedDict

from .cache import element_cache, get_element_id


Element = TypedDict(
    'Element',
    {
        'id': int,
        'collection_string': str,
        'full_data': Optional[Dict[str, Any]],
    }
)

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

    elements: Dict[str, Element] = {}
    for root_instance in root_instances:
        key = root_instance.get_collection_string() + str(root_instance.get_rest_pk())
        elements[key] = Element(
            id=root_instance.get_rest_pk(),
            collection_string=root_instance.get_collection_string(),
            full_data=root_instance.get_full_data())

    bundle = autoupdate_bundle.get(threading.get_ident())
    if bundle is not None:
        # Put all elements into the autoupdate_bundle.
        bundle.update(elements)
    else:
        # Send autoupdate directly
        handle_changed_elements(elements.values())


def inform_deleted_data(deleted_elements: Iterable[Tuple[str, int]]) -> None:
    """
    Informs the autoupdate system and the caching system about the deletion of
    elements.
    """
    elements: Dict[str, Element] = {}
    for deleted_element in deleted_elements:
        key = deleted_element[0] + str(deleted_element[1])
        elements[key] = Element(id=deleted_element[1], collection_string=deleted_element[0], full_data=None)

    bundle = autoupdate_bundle.get(threading.get_ident())
    if bundle is not None:
        # Put all elements into the autoupdate_bundle.
        bundle.update(elements)
    else:
        # Send autoupdate directly
        handle_changed_elements(elements.values())


def inform_changed_elements(changed_elements: Iterable[Element]) -> None:
    """
    Informs the autoupdate system about some collection elements. This is
    used just to send some data to all users.
    """
    elements = {}
    for changed_element in changed_elements:
        key = changed_element['collection_string'] + str(changed_element['id'])
        elements[key] = changed_element

    bundle = autoupdate_bundle.get(threading.get_ident())
    if bundle is not None:
        # Put all collection elements into the autoupdate_bundle.
        bundle.update(elements)
    else:
        # Send autoupdate directly
        handle_changed_elements(elements.values())


"""
Global container for autoupdate bundles
"""
autoupdate_bundle: Dict[int, Dict[str, Element]] = {}


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

        bundle: Dict[str, Element] = autoupdate_bundle.pop(thread_id)
        handle_changed_elements(bundle.values())
        return response


def handle_changed_elements(elements: Iterable[Element]) -> None:
    """
    Helper function, that sends elements through a channel to the
    autoupdate system and updates the cache.

    Does nothing if elements is empty.
    """
    async def update_cache() -> int:
        """
        Async helper function to update the cache.

        Returns the change_id
        """
        cache_elements: Dict[str, Optional[Dict[str, Any]]] = {}
        for element in elements:
            element_id = get_element_id(element['collection_string'], element['id'])
            cache_elements[element_id] = element['full_data']
        return await element_cache.change_elements(cache_elements)

    async def async_handle_collection_elements() -> None:
        """
        Async helper function to update cache and send autoupdate.
        """
        # Update cache
        change_id = await update_cache()

        # Send autoupdate
        channel_layer = get_channel_layer()
        await channel_layer.group_send(
            "autoupdate",
            {
                "type": "send_data",
                "change_id": change_id,
            },
        )

    if elements:
        # TODO: Save histroy here using sync code

        # Update cache and send autoupdate
        async_to_sync(async_handle_collection_elements)()
