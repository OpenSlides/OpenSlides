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
) -> Dict[int, Dict[str, Any]]:
    """
    Callculates and returns the data for one or all projectors.
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
            projector_element = projector_elements.get(projector_config["name"])
            if projector_element is None:
                projector_data[projector_id][uuid] = {
                    "error": "Projector element {} does not exist".format(
                        projector_config["name"]
                    )
                }
            else:
                projector_data[projector_id][uuid] = projector_element(
                    projector_config, all_data
                )
    return projector_data


def get_config(all_data: AllData, key: str) -> Any:
    """
    Returns the config value from all_data.
    """
    from ..core.config import config

    return all_data[config.get_collection_string()][config.get_key_to_id()[key]][
        "value"
    ]
