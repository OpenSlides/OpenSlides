import json
import threading
from collections import defaultdict
from contextlib import contextmanager
from typing import Any, Dict, Iterable, Iterator, List, Optional

from asgiref.sync import async_to_sync
from mypy_extensions import TypedDict

from .cache import element_cache, get_element_id
from .stream import stream
from .timing import Timing
from .utils import get_model_from_collection_string


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
    """

    information: List[str]
    user_id: Optional[int]
    disable_history: bool
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
        self._disable_history = False

    def add(self, elements: Iterable[AutoupdateElement]) -> None:
        """ Adds the elements to the bundle """
        for element in elements:
            self.autoupdate_elements[element["collection_string"]][
                element["id"]
            ] = element

    def disable_history(self) -> None:
        self._disable_history = True

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
        if not self._disable_history:
            save_history(self.element_iterator)

        # Update cache and send autoupdate using async code.
        change_id = async_to_sync(self.dispatch_autoupdate)()

        return change_id

    @property
    def element_iterator(self) -> Iterable[AutoupdateElement]:
        """ Iterator for all elements in this bundle """
        for elements in self.autoupdate_elements.values():
            yield from elements.values()

    async def get_data_for_cache(self) -> Dict[str, Optional[Dict[str, Any]]]:
        """
        Async helper function to update the cache.

        Returns the change_id
        """
        cache_elements: Dict[str, Optional[Dict[str, Any]]] = {}
        for element in self.element_iterator:
            element_id = get_element_id(element["collection_string"], element["id"])
            cache_elements[element_id] = element.get("full_data")
        return cache_elements

    async def dispatch_autoupdate(self) -> int:
        """
        Async helper function to update cache and send autoupdate.

        Return the change_id
        """
        # Update cache
        cache_elements = await self.get_data_for_cache()
        change_id = await element_cache.change_elements(cache_elements)

        # Send autoupdate
        autoupdate_payload = {"elements": cache_elements, "change_id": change_id}
        await stream.send("autoupdate", autoupdate_payload)

        return change_id


@contextmanager
def autoupdate_bundle() -> Iterator[AutoupdateBundle]:
    bundle = _autoupdate_bundle.get(threading.get_ident())
    autodone = False
    if bundle is None:
        bundle = AutoupdateBundle()
        autodone = True

    yield bundle

    if autodone:
        bundle.done()


"""
Global container for autoupdate bundles
"""
_autoupdate_bundle: Dict[int, AutoupdateBundle] = {}


class AutoupdateBundleMiddleware:
    """
    Middleware to handle autoupdate bundling.
    """

    def __init__(self, get_response: Any) -> None:
        self.get_response = get_response
        # One-time configuration and initialization.

    def __call__(self, request: Any) -> Any:
        thread_id = threading.get_ident()
        _autoupdate_bundle[thread_id] = AutoupdateBundle()

        timing = Timing("request")

        response = self.get_response(request)

        timing()

        status_ok = response.status_code >= 200 and response.status_code < 300
        status_redirect = response.status_code >= 300 and response.status_code < 400

        # rewrite the response by adding the autoupdate on any success-case (2xx status)
        bundle: AutoupdateBundle = _autoupdate_bundle.pop(thread_id)
        if status_ok or status_redirect:
            change_id = bundle.done()

            # inject the change id, if there was an autoupdate and the response status is
            # ok (and not redirect; redirects do not have a useful content)
            if change_id is not None and status_ok:
                # Inject the autoupdate in the response.
                # The complete response body will be overwritten!
                content = {"change_id": change_id, "data": response.data}
                # Note: autoupdate may be none on skipped ones (which should not happen
                # since the user has made the request....)
                response.content = json.dumps(content)

        timing(True)
        return response


def save_history(elements: Iterable[AutoupdateElement]) -> Iterable:
    """
    Thin wrapper around the call of history saving manager method.

    This is separated to patch it during tests.
    """
    from ..core.models import History

    return History.objects.add_elements(elements)
