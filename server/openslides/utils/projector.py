"""
General projector code.

Functions  that handel the registration of projector elements and the rendering
of the data to present it on the projector.
"""

from collections import defaultdict
from typing import Any, Awaitable, Callable, Dict, List, Optional

from . import logging
from .cache import element_cache


logger = logging.getLogger(__name__)


class ProjectorElementException(Exception):
    """
    Exception for errors in one element on the projector.
    """


class ProjectorAllDataProvider:
    NON_EXISTENT_MARKER = object()

    def __init__(self) -> None:
        self.cache: Any = defaultdict(dict)  # fuu you mypy
        self.fetched_collection: Dict[str, bool] = {}

    async def get(self, collection: str, id: int) -> Optional[Dict[str, Any]]:
        cache_data = self.cache[collection].get(id)
        if cache_data is None:
            data: Any = await element_cache.get_element_data(collection, id)
            if data is None:
                data = ProjectorAllDataProvider.NON_EXISTENT_MARKER
            self.cache[collection][id] = data

        cache_data = self.cache[collection][id]
        if cache_data == ProjectorAllDataProvider.NON_EXISTENT_MARKER:
            return None
        return cache_data

    async def get_collection(self, collection: str) -> Dict[int, Dict[str, Any]]:
        if not self.fetched_collection.get(collection, False):
            collection_data = await element_cache.get_collection_data(collection)
            self.cache[collection] = collection_data
            self.fetched_collection[collection] = True
        return self.cache[collection]

    async def exists(self, collection: str, id: int) -> bool:
        model = await self.get(collection, id)
        return model is not None


ProjectorSlide = Callable[
    [ProjectorAllDataProvider, Dict[str, Any], int], Awaitable[Dict[str, Any]]
]


projector_slides: Dict[str, ProjectorSlide] = {}


def register_projector_slide(name: str, slide: ProjectorSlide) -> None:
    """
    Registers a projector slide.

    Has to be called in the app.ready method.
    """
    projector_slides[name] = slide


async def get_projector_data(
    projector_ids: List[int] = None,
) -> Dict[int, List[Dict[str, Any]]]:
    """
    Calculates and returns the data for one or all projectors.

    The keys of the returned data are the projector ids as int. When converted
    to json, the numbers will changed to strings like "1".

    The data for each projector is a list of elements.

    Each element is a dict where the keys are "elements", "data". "elements"
    contains the projector elements. It is the same as the projector elements in
    the database. "data" contains all necessary data to render the projector
    element. The key can also be "error" if there is a generall error for the
    slide. In this case the values "elements" and "data" are optional.

    The returned value looks like this:

    projector_data = {
        1: [
            {
                "element": {
                    "name": "agenda/item-list",
                },
                "data": {
                    "items": []
                },
            },
        ],
    }
    """
    if projector_ids is None:
        projector_ids = []

    projector_data: Dict[int, List[Dict[str, Any]]] = {}
    all_data_provider = ProjectorAllDataProvider()
    projectors = await all_data_provider.get_collection("core/projector")

    for projector_id, projector in projectors.items():
        if projector_ids and projector_id not in projector_ids:
            # only render the projector in question.
            continue

        if not projector["elements"]:
            # Skip empty elements.
            continue

        projector_data[projector_id] = []
        for element in projector["elements"]:
            projector_slide = projector_slides[element["name"]]
            try:
                data = await projector_slide(all_data_provider, element, projector_id)
            except ProjectorElementException as err:
                data = {"error": str(err)}
            projector_data[projector_id].append({"data": data, "element": element})

    return projector_data


async def get_config(all_data_provider: ProjectorAllDataProvider, key: str) -> Any:
    """
    Returns a config value from all_data_provider.
    Triggers the cache early: It access `get_colelction` instead of `get`. It
    allows for all successive queries for configs to be cached.
    """
    from ..core.config import config

    config_id = (await config.async_get_key_to_id())[key]

    configs = await all_data_provider.get_collection(config.get_collection_string())
    return configs[config_id]["value"]


async def get_model(
    all_data_provider: ProjectorAllDataProvider, collection: str, id: Any
) -> Dict[str, Any]:
    """
    Tries to get the model identified by the collection and id.
    If the id is invalid or the model not found, ProjectorElementExceptions will be raised.
    """
    if id is None:
        raise ProjectorElementException(f"id is required for {collection} slide")

    model = await all_data_provider.get(collection, id)
    if model is None:
        raise ProjectorElementException(f"{collection} with id {id} does not exist")
    return model


async def get_models(
    all_data_provider: ProjectorAllDataProvider, collection: str, ids: List[Any]
) -> List[Dict[str, Any]]:
    """
    Tries to fetch all given models. Models are required to be all of the collection `collection`.
    """
    logger.info(
        f"Note: a call to `get_models` with {collection}/{ids}. This might be cache-intensive"
    )
    return [await get_model(all_data_provider, collection, id) for id in ids]
