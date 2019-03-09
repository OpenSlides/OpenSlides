from collections import defaultdict
from typing import Any, Dict, List, Union

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


def get_sorted_agenda_items(all_data: AllData) -> List[Dict[str, Any]]:
    """
    Returns all sorted agenda items by id first and then weight, resulting in
    ordered items, if some have the same weight.
    """
    return sorted(
        sorted(all_data["agenda/item"].values(), key=lambda item: item["id"]),
        key=lambda item: item["weight"],
    )


def get_flat_tree(all_data: AllData, parent_id: int = 0) -> List[Dict[str, Any]]:
    """
    Build the item tree from all_data.

    Only build the tree from elements unterneath parent_id.

    Returns a list of two element tuples where the first element is the item title
    and the second a List with children as two element tuples.
    """

    # Build a dict from an item_id to all its children
    children: Dict[int, List[int]] = defaultdict(list)
    if "agenda/item" in all_data:
        for item in get_sorted_agenda_items(all_data):
            if item["type"] == 1:  # only normal items
                children[item["parent_id"] or 0].append(item["id"])

    tree = []

    def get_children(item_ids: List[int], depth: int) -> None:
        for item_id in item_ids:
            tree.append(
                {
                    "item_number": all_data["agenda/item"][item_id]["item_number"],
                    "title_information": all_data["agenda/item"][item_id][
                        "title_information"
                    ],
                    "collection": all_data["agenda/item"][item_id]["content_object"][
                        "collection"
                    ],
                    "depth": depth,
                }
            )
            get_children(children[item_id], depth + 1)

    get_children(children[parent_id], 0)
    return tree


def item_list_slide(
    all_data: AllData, element: Dict[str, Any], projector_id: int
) -> Dict[str, Any]:
    """
    Item list slide.

    Returns all root items or all children of an item.
    """
    only_main_items = element.get("only_main_items", True)

    if only_main_items:
        agenda_items = []
        for item in get_sorted_agenda_items(all_data):
            if item["parent_id"] is None and item["type"] == 1:
                agenda_items.append(
                    {
                        "item_number": item["item_number"],
                        "title_information": item["title_information"],
                        "collection": item["content_object"]["collection"],
                    }
                )
    else:
        agenda_items = get_flat_tree(all_data)

    return {"items": agenda_items}


def list_of_speakers_slide(
    all_data: AllData, element: Dict[str, Any], projector_id: int
) -> Dict[str, Any]:
    """
    List of speakers slide.

    Returns all usernames, that are on the list of speaker of a slide.
    """
    item_id = element.get("id")

    if item_id is None:
        raise ProjectorElementException("id is required for list of speakers slide")

    return get_list_of_speakers_slide_data(all_data, item_id)


def get_list_of_speakers_slide_data(all_data: AllData, item_id: int) -> Dict[str, Any]:
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


def get_current_item_id_for_projector(
    all_data: AllData, projector: Dict[str, Any]
) -> Union[int, None]:
    """
    Search for elements, that do have an agenda item:
    Try to get a model by the collection and id in the element. This
    model needs to have a 'agenda_item_id'. This item must exist. The first
    matching element is taken.
    """
    elements = projector["elements"]
    item_id = None
    for element in elements:
        if "id" not in element:
            continue
        collection = element["name"]
        id = element["id"]
        if collection not in all_data or id not in all_data[collection]:
            continue

        model = all_data[collection][id]
        if "agenda_item_id" not in model:
            continue

        if not model["agenda_item_id"] in all_data["agenda/item"]:
            continue

        item_id = model["agenda_item_id"]
        break

    return item_id


def get_reference_projector(all_data: AllData, projector_id: int) -> Dict[str, Any]:
    """
    Returns the reference projector to the given projector (by id)
    """
    try:
        this_projector = all_data["core/projector"][projector_id]
    except KeyError:
        raise ProjectorElementException(f"Projector {projector_id} does not exist")

    reference_projector_id = this_projector["reference_projector_id"] or projector_id
    try:
        reference_projector = all_data["core/projector"][reference_projector_id]
    except KeyError:
        raise ProjectorElementException(
            f"Projector {reference_projector_id} does not exist"
        )

    return reference_projector


def current_list_of_speakers_slide(
    all_data: AllData, element: Dict[str, Any], projector_id: int
) -> Dict[str, Any]:
    """
    The current list of speakers slide. Creates the data for the given projector.
    """
    reference_projector = get_reference_projector(all_data, projector_id)
    item_id = get_current_item_id_for_projector(all_data, reference_projector)
    if item_id is None:  # no element found
        return {}

    return get_list_of_speakers_slide_data(all_data, item_id)


def current_speaker_chyron_slide(
    all_data: AllData, element: Dict[str, Any], projector_id: int
) -> Dict[str, Any]:
    """
    Returns the username for the current speaker.
    """
    reference_projector = get_reference_projector(all_data, projector_id)
    item_id = get_current_item_id_for_projector(all_data, reference_projector)
    if item_id is None:  # no element found
        return {}

    # get item
    try:
        item = all_data["agenda/item"][item_id]
    except KeyError:
        raise ProjectorElementException(f"Item {item_id} does not exist")

    # find current speaker
    current_speaker = None
    for speaker in item["speakers"]:
        if speaker["begin_time"] is not None and speaker["end_time"] is None:
            current_speaker = get_user_name(all_data, speaker["user_id"])

    return {"current_speaker": current_speaker}


def register_projector_slides() -> None:
    register_projector_slide("agenda/item-list", item_list_slide)
    register_projector_slide("agenda/list-of-speakers", list_of_speakers_slide)
    register_projector_slide(
        "agenda/current-list-of-speakers", current_list_of_speakers_slide
    )
    register_projector_slide(
        "agenda/current-list-of-speakers-overlay", current_list_of_speakers_slide
    )
    register_projector_slide(
        "agenda/current-speaker-chyron", current_speaker_chyron_slide
    )
