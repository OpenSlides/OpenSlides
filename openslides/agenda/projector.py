from collections import defaultdict
from typing import Any, Dict, List, Tuple

from ..utils.projector import (
    AllData,
    ProjectorElementException,
    register_projector_slide,
)


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


def items_slide(all_data: AllData, element: Dict[str, Any]) -> Dict[str, Any]:
    """
    Item list slide.

    Returns all root items or all children of an item.
    """
    root_item_id = element.get("id") or None
    show_tree = element.get("tree") or False

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


def list_of_speakers_slide(
    all_data: AllData, element: Dict[str, Any]
) -> Dict[str, Any]:
    """
    List of speakers slide.

    Returns all usernames, that are on the list of speaker of a slide.
    """
    item_id = element.get("id") or 0  # item_id 0 means current_list_of_speakers

    # TODO: handle item_id == 0

    try:
        item = all_data["agenda/item"][item_id]
    except KeyError:
        raise ProjectorElementException(f"Item {item_id} does not exist")

    user_ids = []
    for speaker in item["speakers"]:
        user_ids.append(speaker["user"])
    return {"user_ids": user_ids}


def current_list_of_speakers_slide(
    all_data: AllData, element: Dict[str, Any]
) -> Dict[str, Any]:
    """
    TODO

    Note: This data is for all projectors showing this slide, so we cannot give projector-
    specific data. The work-around is to make a dict with projector-ids as keys and the
    data-per-projector as values. This is not a security concern, because if a person can
    see one projector, he is able to see all others, too. Maybe a bit more data..
    """
    return {"error": "TODO"}


def register_projector_slides() -> None:
    register_projector_slide("agenda/item-list", items_slide)
    register_projector_slide("agenda/list-of-speakers", list_of_speakers_slide)
    register_projector_slide(
        "agenda/current-list-of-speakers", current_list_of_speakers_slide
    )
    register_projector_slide(
        "agenda/current-list-of-speakers-overlay", current_list_of_speakers_slide
    )
