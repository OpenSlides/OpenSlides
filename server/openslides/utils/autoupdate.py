import json
import threading
from collections import defaultdict
from typing import Any, Dict, Iterable, List, Optional, Tuple, Union

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models import Model
from mypy_extensions import TypedDict

from .auth import UserDoesNotExist
from .cache import ChangeIdTooLowError, element_cache, get_element_id
from .projector import get_projector_data
from .timing import Timing
from .utils import get_model_from_collection_string, is_iterable, split_element_id


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

    def done(self) -> Optional[int]:
        """
        Finishes the bundle by resolving all missing data and passing it to
        the history and element cache.

        Returns the change id, if there are autoupdate elements. Otherwise none.
        """
        if not self.autoupdate_elements:
            return None

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
        save_history(self.element_iterator)

        # Update cache and send autoupdate using async code.
        change_id = async_to_sync(self.dispatch_autoupdate)()
        return change_id

    @property
    def element_iterator(self) -> Iterable[AutoupdateElement]:
        """ Iterator for all elements in this bundle """
        for elements in self.autoupdate_elements.values():
            yield from elements.values()

    async def update_cache(self) -> int:
        """
        Async helper function to update the cache.

        Returns the change_id
        """
        cache_elements: Dict[str, Optional[Dict[str, Any]]] = {}
        for element in self.element_iterator:
            element_id = get_element_id(element["collection_string"], element["id"])
            full_data = element.get("full_data")
            if full_data:
                full_data["_no_delete_on_restriction"] = element.get(
                    "no_delete_on_restriction", False
                )
            cache_elements[element_id] = full_data
        return await element_cache.change_elements(cache_elements)

    async def dispatch_autoupdate(self) -> int:
        """
        Async helper function to update cache and send autoupdate.

        Return the change_id
        """
        # Update cache
        change_id = await self.update_cache()

        # Send autoupdate
        channel_layer = get_channel_layer()
        await channel_layer.group_send(
            "autoupdate", {"type": "msg_new_change_id", "change_id": change_id}
        )

        # Send projector
        projector_data = await get_projector_data()
        channel_layer = get_channel_layer()
        await channel_layer.group_send(
            "projector",
            {
                "type": "msg_projector_data",
                "data": projector_data,
                "change_id": change_id,
            },
        )

        return change_id


def inform_changed_data(
    instances: Union[Iterable[Model], Model],
    information: List[str] = None,
    user_id: Optional[int] = None,
    disable_history: bool = False,
    no_delete_on_restriction: bool = False,
    final_data: bool = False,
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

    elements = []
    for root_instance in root_instances:
        element = AutoupdateElement(
            id=root_instance.get_rest_pk(),
            collection_string=root_instance.get_collection_string(),
            disable_history=disable_history,
            information=information,
            user_id=user_id,
            no_delete_on_restriction=no_delete_on_restriction,
        )
        if final_data:
            element["full_data"] = root_instance.get_full_data()
        elements.append(element)
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

        timing = Timing("request")

        response = self.get_response(request)

        timing()

        status_ok = response.status_code >= 200 and response.status_code < 300
        status_redirect = response.status_code >= 300 and response.status_code < 400

        # rewrite the response by adding the autoupdate on any success-case (2xx status)
        bundle: AutoupdateBundle = autoupdate_bundle.pop(thread_id)
        if status_ok or status_redirect:
            change_id = bundle.done()

            # inject the autoupdate, if there is an autoupdate and the status is
            # ok (and not redirect; redirects do not have a useful content)
            if change_id is not None and status_ok:
                user_id = request.user.pk or 0
                # Inject the autoupdate in the response.
                # The complete response body will be overwritten!
                _, autoupdate = async_to_sync(get_autoupdate_data)(change_id, user_id)
                content = {"autoupdate": autoupdate, "data": response.data}
                # Note: autoupdate may be none on skipped ones (which should not happen
                # since the user has made the request....)
                response.content = json.dumps(content)

        timing(True)
        return response


async def get_autoupdate_data(
    from_change_id: int, user_id: int
) -> Tuple[int, Optional[AutoupdateFormat]]:
    try:
        return await _get_autoupdate_data(from_change_id, user_id)
    except UserDoesNotExist:
        return 0, None


async def _get_autoupdate_data(
    from_change_id: int, user_id: int
) -> Tuple[int, Optional[AutoupdateFormat]]:
    """
    Returns the max_change_id and the autoupdate from from_change_id to max_change_id
    """
    try:
        (
            max_change_id,
            changed_elements,
            deleted_element_ids,
        ) = await element_cache.get_data_since(user_id, from_change_id)
    except ChangeIdTooLowError:
        # The change_id is lower the the lowerst change_id in redis. Return all data
        (
            max_change_id,
            changed_elements,
        ) = await element_cache.get_all_data_list_with_max_change_id(user_id)
        deleted_elements: Dict[str, List[int]] = {}
        all_data = True
    else:
        all_data = False
        deleted_elements = defaultdict(list)
        for element_id in deleted_element_ids:
            collection_string, id = split_element_id(element_id)
            deleted_elements[collection_string].append(id)

    # Check, if the autoupdate has any data.
    if not changed_elements and not deleted_element_ids:
        # Skip empty updates
        return max_change_id, None
    else:
        # Normal autoupdate with data
        return (
            max_change_id,
            AutoupdateFormat(
                changed=changed_elements,
                deleted=deleted_elements,
                from_change_id=from_change_id,
                to_change_id=max_change_id,
                all_data=all_data,
            ),
        )


def save_history(element_iterator: Iterable[AutoupdateElement]) -> Iterable:
    """
    Thin wrapper around the call of history saving manager method.

    This is separated to patch it during tests.
    """
    from ..core.models import History

    return History.objects.add_elements(element_iterator)
