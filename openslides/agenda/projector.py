from collections import defaultdict
from typing import Any, Dict, List, Tuple

from ..users.projector import get_user_name
from ..utils.projector import (
    AllData,
    ProjectorElementException,
    get_config,
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
    item_id = element.get("id")

    if item_id is None:
        raise ProjectorElementException("id is required for list of speakers slide")

    try:
        item = all_data["agenda/item"][item_id]
    except KeyError:
        raise ProjectorElementException(f"Item {item_id} does not exist")

    # Partition speaker objects to waiting, current and finished
    speakers_waiting = []
    speakers_finished = []
    current_speaker = None
    for speaker in item["speakers"]:
        user = get_user_name(all_data, speaker["user_id"])
        formatted_speaker = {
            "user": user,
            "marked": speaker["marked"],
            "weight": speaker["weight"],
            "end_time": speaker["end_time"],
        }

        if speaker["begin_time"] is None and speaker["end_time"] is None:
            speakers_waiting.append(formatted_speaker)
        elif speaker["begin_time"] is not None and speaker["end_time"] is None:
            current_speaker = formatted_speaker
        else:
            speakers_finished.append(formatted_speaker)

    # sort speakers
    speakers_waiting = sorted(speakers_waiting, key=lambda s: s["weight"])
    speakers_finished = sorted(speakers_finished, key=lambda s: s["end_time"])

    number_of_last_speakers = get_config(all_data, "agenda_show_last_speakers")
    if number_of_last_speakers == 0:
        speakers_finished = []
    else:
        speakers_finished = speakers_finished[
            -number_of_last_speakers:
        ]  # Take the last speakers

    return {
        "waiting": speakers_waiting,
        "current": current_speaker,
        "finished": speakers_finished,
        "content_object_collection": item["content_object"]["collection"],
        "title_information": item["title_information"],
        "item_number": item["item_number"],
    }


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
