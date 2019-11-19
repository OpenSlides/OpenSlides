import threading
from collections import defaultdict
from typing import Any, Dict, Iterable, List, Optional, Tuple, Union

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models import Model
from mypy_extensions import TypedDict

from .cache import element_cache, get_element_id
from .projector import get_projector_data
from .utils import get_model_from_collection_string, is_iterable


class AutoupdateElementBase(TypedDict):
    id: int
    collection_string: str


class AutoupdateElement(AutoupdateElementBase, total=False):
    """
    Data container to handle one root rest element for the autoupdate, history
    and caching process.

    The fields `id` and `collection_string` are required to identify the element. All
    other fields are optional:

    full_data: If a value is given (dict or None), it won't be loaded from the DB.
    If otherwise no value is given, the AutoupdateBundle will try to resolve the object
    from the DB and serialize it into the full_data.

    information and user_id: These fields are for the history indicating what and who
    made changes.

    disable_history: If this is True, the element (and the containing full_data) won't
    be saved into the history. Information and user_id is then irrelevant.

    no_delete_on_restriction is a flag, which is saved into the models in the cache
    as the _no_delete_on_restriction key. If this is true, there should neither be an
    entry for one specific model in the changed *nor the deleted* part of the
    autoupdate, if the model was restricted.
    """

    information: List[str]
    user_id: Optional[int]
    disable_history: bool
    no_delete_on_restriction: bool
    full_data: Optional[Dict[str, Any]]


class AutoupdateBundle:
    """
    Collects changed elements via inform*_data. After the collecting-step is finished,
    the bundle releases all changes to the history and element cache via `.done()`.
    """

    def __init__(self) -> None:
        self.autoupdate_elements: Dict[str, Dict[int, AutoupdateElement]] = defaultdict(
            dict
        )

    def add(self, elements: Iterable[AutoupdateElement]) -> None:
        """ Adds the elements to the bundle """
        for element in elements:
            self.autoupdate_elements[element["collection_string"]][
                element["id"]
            ] = element

    def done(self) -> None:
        """
        Finishes the bundle by resolving all missing data and passing it to
        the history and element cache.
        """
        if not self.autoupdate_elements:
            return

        for collection, elements in self.autoupdate_elements.items():
            # Get all ids, that do not have a full_data key
            # (element["full_data"]=None will not be resolved again!)
            ids = [
                element["id"]
                for element in elements.values()
                if "full_data" not in element
            ]
            if ids:
                # Get all missing models. If e.g. an id could not be found it
                # means, it was deleted. Since there is not full_data entry
                # for the element, the data will be interpreted as None, which
                # is correct for deleted elements.
                model_class = get_model_from_collection_string(collection)
                for full_data in model_class.get_elements(ids):
                    elements[full_data["id"]]["full_data"] = full_data

        # Save histroy here using sync code.
        save_history(self.elements)

        # Update cache and send autoupdate using async code.
        async_to_sync(self.async_handle_collection_elements)()

    @property
    def elements(self) -> Iterable[AutoupdateElement]:
        """ Iterator for all elements in this bundle """
        for elements in self.autoupdate_elements.values():
            yield from elements.values()

    async def update_cache(self) -> int:
        """
        Async helper function to update the cache.

        Returns the change_id
        """
        cache_elements: Dict[str, Optional[Dict[str, Any]]] = {}
        for element in self.elements:
            element_id = get_element_id(element["collection_string"], element["id"])
            full_data = element.get("full_data")
            if full_data:
                full_data["_no_delete_on_restriction"] = element.get(
                    "no_delete_on_restriction", False
                )
            cache_elements[element_id] = full_data
        return await element_cache.change_elements(cache_elements)

    async def async_handle_collection_elements(self) -> None:
        """
        Async helper function to update cache and send autoupdate.
        """
        # Update cache
        change_id = await self.update_cache()

        # Send autoupdate
        channel_layer = get_channel_layer()
        await channel_layer.group_send(
            "autoupdate", {"type": "send_data", "change_id": change_id}
        )

        projector_data = await get_projector_data()
        # Send projector
        channel_layer = get_channel_layer()
        await channel_layer.group_send(
            "projector",
            {
                "type": "projector_changed",
                "data": projector_data,
                "change_id": change_id,
            },
        )


def inform_changed_data(
    instances: Union[Iterable[Model], Model],
    information: List[str] = None,
    user_id: Optional[int] = None,
    disable_history: bool = False,
    no_delete_on_restriction: bool = False,
) -> None:
    """
    Informs the autoupdate system and the caching system about the creation or
    update of an element.

    The argument instances can be one instance or an iterable over instances.

    History creation is enabled.
    """
    if information is None:
        information = []
    if not is_iterable(instances):
        instances = (instances,)

    root_instances = set(instance.get_root_rest_element() for instance in instances)
    elements = [
        AutoupdateElement(
            id=root_instance.get_rest_pk(),
            collection_string=root_instance.get_collection_string(),
            disable_history=disable_history,
            information=information,
            user_id=user_id,
            no_delete_on_restriction=no_delete_on_restriction,
        )
        for root_instance in root_instances
    ]
    inform_elements(elements)


def inform_deleted_data(
    deleted_elements: Iterable[Tuple[str, int]],
    information: List[str] = None,
    user_id: Optional[int] = None,
) -> None:
    """
    Informs the autoupdate system and the caching system about the deletion of
    elements.

    History creation is enabled.
    """
    if information is None:
        information = []

    elements = [
        AutoupdateElement(
            id=deleted_element[1],
            collection_string=deleted_element[0],
            full_data=None,
            information=information,
            user_id=user_id,
        )
        for deleted_element in deleted_elements
    ]
    inform_elements(elements)


def inform_elements(elements: Iterable[AutoupdateElement]) -> None:
    """
    Informs the autoupdate system about some elements. This is used just to send
    some data to all users.

    If you want to save history information, user id or disable history you
    have to put information or flag inside the elements.
    """
    bundle = autoupdate_bundle.get(threading.get_ident())
    if bundle is not None:
        # Put all elements into the autoupdate_bundle.
        bundle.add(elements)
    else:
        # Send autoupdate directly
        bundle = AutoupdateBundle()
        bundle.add(elements)
        bundle.done()


"""
Global container for autoupdate bundles
"""
autoupdate_bundle: Dict[int, AutoupdateBundle] = {}


class AutoupdateBundleMiddleware:
    """
    Middleware to handle autoupdate bundling.
    """

    def __init__(self, get_response: Any) -> None:
        self.get_response = get_response
        # One-time configuration and initialization.

    def __call__(self, request: Any) -> Any:
        thread_id = threading.get_ident()
        autoupdate_bundle[thread_id] = AutoupdateBundle()

        response = self.get_response(request)

        bundle: AutoupdateBundle = autoupdate_bundle.pop(thread_id)
        bundle.done()
        return response


def save_history(elements: Iterable[AutoupdateElement]) -> Iterable:
    """
    Thin wrapper around the call of history saving manager method.

    This is separated to patch it during tests.
    """
    from ..core.models import History

    return History.objects.add_elements(elements)
