"""
General projector code.

Functions  that handel the registration of projector elements and the rendering
of the data to present it on the projector.
"""

from typing import Any, Callable, Dict, List

from .cache import element_cache


AllData = Dict[str, Dict[int, Dict[str, Any]]]
ProjectorElementCallable = Callable[[Dict[str, Any], AllData], Dict[str, Any]]


projector_elements: Dict[str, ProjectorElementCallable] = {}


def register_projector_element(name: str, element: ProjectorElementCallable) -> None:
    """
    Registers a projector element.

    Has to be called in the app.ready method.
    """
    projector_elements[name] = element


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

    all_data = await element_cache.get_all_full_data_ordered()
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
            projector_element = projector_elements[element["name"]]
            projector_data[projector_id].append(
                {"data": projector_element(element, all_data), "element": element}
            )

    return projector_data


def get_config(all_data: AllData, key: str) -> Any:
    """
    Returns a config value from all_data.
    """
    from ..core.config import config

    return all_data[config.get_collection_string()][config.get_key_to_id()[key]][
        "value"
    ]


def get_user(all_data: AllData, user_id: int) -> Dict[str, Any]:
    """
    Returns the value of a user to show his name.
    """
    user = all_data["users/user"][user_id]
    return {
        "title": user["title"],
        "first_name": user["first_name"],
        "last_name": user["last_name"],
    }
