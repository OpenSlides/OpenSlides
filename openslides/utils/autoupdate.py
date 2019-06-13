import threading
from typing import Any, Dict, Iterable, List, Optional, Tuple, Union

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models import Model
from mypy_extensions import TypedDict

from .cache import element_cache, get_element_id
from .projector import get_projector_data
from .utils import get_model_from_collection_string


class ElementBase(TypedDict):
    id: int
    collection_string: str
    full_data: Optional[Dict[str, Any]]


class Element(ElementBase, total=False):
    """
    Data container to handle one root rest element for the autoupdate, history
    and caching process.

    The fields `id`, `collection_string` and `full_data` are required, the other
    fields are optional.

    if full_data is None, it means, that the element was deleted. If reload is
    True, full_data is ignored and reloaded from the database later in the
    process.
    """

    information: List[str]
    restricted: bool
    user_id: Optional[int]
    disable_history: bool
    reload: bool


AutoupdateFormat = TypedDict(
    "AutoupdateFormat",
    {
        "changed": Dict[str, List[Dict[str, Any]]],
        "deleted": Dict[str, List[int]],
        "from_change_id": int,
        "to_change_id": int,
        "all_data": bool,
    },
)


def inform_changed_data(
    instances: Union[Iterable[Model], Model],
    information: List[str] = None,
    user_id: Optional[int] = None,
    restricted: bool = False,
) -> None:
    """
    Informs the autoupdate system and the caching system about the creation or
    update of an element.

    The argument instances can be one instance or an iterable over instances.

    History creation is enabled.
    """
    if information is None:
        information = []
    root_instances = set()
    if not isinstance(instances, Iterable):
        instances = (instances,)

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
            full_data=root_instance.get_full_data(),
            information=information,
            restricted=restricted,
            user_id=user_id,
        )

    bundle = autoupdate_bundle.get(threading.get_ident())
    if bundle is not None:
        # Put all elements into the autoupdate_bundle.
        bundle.update(elements)
    else:
        # Send autoupdate directly
        handle_changed_elements(elements.values())


def inform_deleted_data(
    deleted_elements: Iterable[Tuple[str, int]],
    information: List[str] = None,
    user_id: Optional[int] = None,
    restricted: bool = False,
) -> None:
    """
    Informs the autoupdate system and the caching system about the deletion of
    elements.

    History creation is enabled.
    """
    if information is None:
        information = []
    elements: Dict[str, Element] = {}
    for deleted_element in deleted_elements:
        key = deleted_element[0] + str(deleted_element[1])
        elements[key] = Element(
            id=deleted_element[1],
            collection_string=deleted_element[0],
            full_data=None,
            information=information,
            restricted=restricted,
            user_id=user_id,
        )

    bundle = autoupdate_bundle.get(threading.get_ident())
    if bundle is not None:
        # Put all elements into the autoupdate_bundle.
        bundle.update(elements)
    else:
        # Send autoupdate directly
        handle_changed_elements(elements.values())


def inform_changed_elements(changed_elements: Iterable[Element]) -> None:
    """
    Informs the autoupdate system about some elements. This is used just to send
    some data to all users.

    If you want to save history information, user id or disable history you
    have to put information or flag inside the elements.
    """
    elements = {}
    for changed_element in changed_elements:
        key = changed_element["collection_string"] + str(changed_element["id"])
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

    async def update_cache(elements: Iterable[Element]) -> int:
        """
        Async helper function to update the cache.

        Returns the change_id
        """
        cache_elements: Dict[str, Optional[Dict[str, Any]]] = {}
        for element in elements:
            element_id = get_element_id(element["collection_string"], element["id"])
            cache_elements[element_id] = element["full_data"]
        return await element_cache.change_elements(cache_elements)

    async def async_handle_collection_elements(elements: Iterable[Element]) -> None:
        """
        Async helper function to update cache and send autoupdate.
        """
        # Update cache
        change_id = await update_cache(elements)

        # Send autoupdate
        channel_layer = get_channel_layer()
        await channel_layer.group_send(
            "autoupdate", {"type": "send_data", "change_id": change_id}
        )

        projector_data = await get_projector_data()
        # Send projector
        channel_layer = get_channel_layer()
        await channel_layer.group_send(
            "projector", {"type": "projector_changed", "data": projector_data}
        )

    if elements:
        for element in elements:
            if element.get("reload"):
                model = get_model_from_collection_string(element["collection_string"])
                try:
                    instance = model.objects.get(pk=element["id"])
                except model.DoesNotExist:
                    # The instance was deleted so we set full_data explicitly to None.
                    element["full_data"] = None
                else:
                    element["full_data"] = instance.get_full_data()

        # Save histroy here using sync code.
        save_history(elements)

        # Update cache and send autoupdate using async code.
        async_to_sync(async_handle_collection_elements)(elements)


def save_history(elements: Iterable[Element]) -> Iterable:
    # TODO: Try to write Iterable[History] here
    """
    Thin wrapper around the call of history saving manager method.

    This is separated to patch it during tests.
    """
    from ..core.models import History

    return History.objects.add_elements(elements)
