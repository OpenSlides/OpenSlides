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


async def get_projectot_data(
    projector_ids: List[int] = None
) -> Dict[int, Dict[str, Dict[str, Any]]]:
    """
    Callculates and returns the data for one or all projectors.

    The keys of the returned data are the projector ids as int. When converted
    to json, the numbers will changed to strings like "1".

    The data for each projector is a dict. The keys are the uuids of the
    elements as strings. If there is a generell problem with the projector, the
    key can be 'error'.

    Each element is a dict where the keys are "config", "data". "config"
    contains the projector config. It is the same as the projector config in the
    database. "data" contains all necessary data to render the projector
    element. The key can also be "error" if there is a generall error for the
    slide. In this case the values "config" and "data" are optional.

    The returned value looks like this:

    projector_data = {
        1: {
            "UnIqUe-UUID": {
                "config": {
                    "name": "agenda/item-list",
                },
                "data": {
                    "items": []
                },
            },
        },
        2: {
            "error": {
                "error": "Projector has no config",
            },
        },
    }
    """
    if projector_ids is None:
        projector_ids = []

    all_data = await element_cache.get_all_full_data_ordered()
    projector_data: Dict[int, Dict[str, Dict[str, Any]]] = {}

    for projector_id, projector in all_data.get("core/projector", {}).items():
        if projector_ids and projector_id not in projector_ids:
            # only render the projector in question.
            continue

        projector_data[projector_id] = {}
        if not projector["config"]:
            projector_data[projector_id] = {
                "error": {"error": "Projector has no config"}
            }
            continue

        for uuid, projector_config in projector["config"].items():
            projector_data[projector_id][uuid] = {"config": projector_config}
            projector_element = projector_elements.get(projector_config["name"])
            if projector_element is None:
                projector_data[projector_id][uuid][
                    "error"
                ] = f"Projector element {projector_config['name']} does not exist"
            else:
                projector_data[projector_id][uuid]["data"] = projector_element(
                    projector_config, all_data
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
