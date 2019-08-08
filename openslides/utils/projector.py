"""
General projector code.

Functions  that handel the registration of projector elements and the rendering
of the data to present it on the projector.
"""

from typing import Any, Awaitable, Callable, Dict, List

from .cache import element_cache


AllData = Dict[str, Dict[int, Dict[str, Any]]]
ProjectorSlide = Callable[[AllData, Dict[str, Any], int], Awaitable[Dict[str, Any]]]


projector_slides: Dict[str, ProjectorSlide] = {}


class ProjectorElementException(Exception):
    """
    Exception for errors in one element on the projector.
    """


def register_projector_slide(name: str, slide: ProjectorSlide) -> None:
    """
    Registers a projector slide.

    Has to be called in the app.ready method.
    """
    projector_slides[name] = slide


async def get_projector_data(
    projector_ids: List[int] = None
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

    all_data = await element_cache.get_all_data_dict()
    projector_data: Dict[int, List[Dict[str, Any]]] = {}

    for projector_id, projector in all_data.get("core/projector", {}).items():
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
                data = await projector_slide(all_data, element, projector_id)
            except ProjectorElementException as err:
                data = {"error": str(err)}
            projector_data[projector_id].append({"data": data, "element": element})

    return projector_data


async def get_config(all_data: AllData, key: str) -> Any:
    """
    Returns a config value from all_data.
    """
    from ..core.config import config

    config_id = (await config.async_get_key_to_id())[key]

    return all_data[config.get_collection_string()][config_id]["value"]
