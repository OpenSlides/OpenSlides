from collections import defaultdict
from typing import Any, Dict, List, Tuple

from ..utils.projector import AllData, register_projector_element


# Important: All functions have to be prune. This means, that thay can only
#            access the data, that they get as argument and do not have any
#            side effects. They are called from an async context. So they have
#            to be fast!


def get_tree(
    all_data: AllData, parent_id: int = 0
) -> List[Tuple[int, List[Tuple[int, List[Any]]]]]:
    """
    Build the item tree from all_data.

    Only build the tree from elements unterneath parent_id.

    Returns a list of two element tuples where the first element is the item title
    and the second a List with children as two element tuples.
    """

    # Build a dict from an item_id to all its children
    children: Dict[int, List[int]] = defaultdict(list)
    for item in sorted(
        all_data["agenda/item"].values(), key=lambda item: item["weight"]
    ):
        if item["type"] == 1:  # only normal items
            children[item["parent_id"] or 0].append(item["id"])

    def get_children(
        item_ids: List[int]
    ) -> List[Tuple[int, List[Tuple[int, List[Any]]]]]:
        return [
            (all_data["agenda/item"][item_id]["title"], get_children(children[item_id]))
            for item_id in item_ids
        ]

    return get_children(children[parent_id])


def items(config: Dict[str, Any], all_data: AllData) -> Dict[str, Any]:
    """
    Item list slide.

    Returns all root items or all children of an item.
    """
    root_item_id = config.get("id") or None
    show_tree = config.get("tree") or False

    if show_tree:
        agenda_items = get_tree(all_data, root_item_id or 0)
    else:
        agenda_items = []
        for item in sorted(
            all_data["agenda/item"].values(), key=lambda item: item["weight"]
        ):
            if item["parent_id"] == root_item_id and item["type"] == 1:
                agenda_items.append(item["title"])

    return {"items": agenda_items}


def list_of_speakers(config: Dict[str, Any], all_data: AllData) -> Dict[str, Any]:
    """
    List of speakers slide.

    Returns all usernames, that are on the list of speaker of a slide.
    """
    item_id = config.get("id") or 0  # item_id 0 means current_list_of_speakers

    # TODO: handle item_id == 0

    try:
        item = all_data["agenda/item"][item_id]
    except KeyError:
        return {"error": f"Item {item_id} does not exist"}

    user_ids = []
    for speaker in item["speakers"]:
        user_ids.append(speaker["user"])
    return {"user_ids": user_ids}


def register_projector_elements() -> None:
    register_projector_element("agenda/item-list", items)
    register_projector_element("agenda/list-of-speakers", list_of_speakers)
