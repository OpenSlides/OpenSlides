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
#            side effects.


async def get_sorted_agenda_items(all_data: AllData) -> List[Dict[str, Any]]:
    """
    Returns all sorted agenda items by id first and then weight, resulting in
    ordered items, if some have the same weight.
    """
    return sorted(
        sorted(all_data["agenda/item"].values(), key=lambda item: item["id"]),
        key=lambda item: item["weight"],
    )


async def get_flat_tree(all_data: AllData, parent_id: int = 0) -> List[Dict[str, Any]]:
    """
    Build the item tree from all_data.

    Only build the tree from elements unterneath parent_id.

    Returns a list of two element tuples where the first element is the item title
    and the second a List with children as two element tuples.
    """

    # Build a dict from an item_id to all its children
    children: Dict[int, List[int]] = defaultdict(list)
    if "agenda/item" in all_data:
        for item in await get_sorted_agenda_items(all_data):
            if item["type"] == 1:  # only normal items
                children[item["parent_id"] or 0].append(item["id"])

    tree = []

    async def get_children(item_ids: List[int], depth: int) -> None:
        for item_id in item_ids:
            item = all_data["agenda/item"][item_id]
            title_information = item["title_information"]
            title_information["agenda_item_number"] = item["item_number"]
            tree.append(
                {
                    "title_information": title_information,
                    "collection": item["content_object"]["collection"],
                    "depth": depth,
                }
            )
            await get_children(children[item_id], depth + 1)

    await get_children(children[parent_id], 0)
    return tree


async def item_list_slide(
    all_data: AllData, element: Dict[str, Any], projector_id: int
) -> Dict[str, Any]:
    """
    Item list slide.

    Returns all root items or all children of an item.
    """
    only_main_items = element.get("only_main_items", True)

    if only_main_items:
        agenda_items = []
        for item in await get_sorted_agenda_items(all_data):
            if item["parent_id"] is None and item["type"] == 1:
                title_information = item["title_information"]
                title_information["agenda_item_number"] = item["item_number"]
                agenda_items.append(
                    {
                        "title_information": title_information,
                        "collection": item["content_object"]["collection"],
                    }
                )
    else:
        agenda_items = await get_flat_tree(all_data)

    return {"items": agenda_items}


async def list_of_speakers_slide(
    all_data: AllData, element: Dict[str, Any], projector_id: int
) -> Dict[str, Any]:
    """
    List of speakers slide.

    Returns all usernames, that are on the list of speaker of a slide.
    """
    list_of_speakers_id = element.get("id")

    if list_of_speakers_id is None:
        raise ProjectorElementException("id is required for list of speakers slide")

    return await get_list_of_speakers_slide_data(all_data, list_of_speakers_id)


async def get_list_of_speakers_slide_data(
    all_data: AllData, list_of_speakers_id: int
) -> Dict[str, Any]:
    try:
        list_of_speakers = all_data["agenda/list-of-speakers"][list_of_speakers_id]
    except KeyError:
        raise ProjectorElementException(
            f"List of speakers {list_of_speakers_id} does not exist"
        )

    title_information = list_of_speakers["title_information"]
    # try to get the agenda item for the content object (which must not exist)
    agenda_item_id = all_data[list_of_speakers["content_object"]["collection"]][
        list_of_speakers["content_object"]["id"]
    ].get("agenda_item_id")
    if agenda_item_id:
        title_information["agenda_item_number"] = all_data["agenda/item"][
            agenda_item_id
        ]["item_number"]

    # Partition speaker objects to waiting, current and finished
    speakers_waiting = []
    speakers_finished = []
    current_speaker = None
    for speaker in list_of_speakers["speakers"]:
        user = await get_user_name(all_data, speaker["user_id"])
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

    number_of_last_speakers = await get_config(all_data, "agenda_show_last_speakers")
    number_of_next_speakers = await get_config(all_data, "agenda_show_next_speakers")

    if number_of_last_speakers == 0:
        speakers_finished = []
    else:
        # Take the last speakers
        speakers_finished = speakers_finished[-number_of_last_speakers:]

    if number_of_next_speakers != -1:
        speakers_waiting = speakers_waiting[:number_of_next_speakers]

    return {
        "waiting": speakers_waiting,
        "current": current_speaker,
        "finished": speakers_finished,
        "content_object_collection": list_of_speakers["content_object"]["collection"],
        "title_information": title_information,
    }


async def get_current_list_of_speakers_id_for_projector(
    all_data: AllData, projector: Dict[str, Any]
) -> Union[int, None]:
    """
    Search for elements, that do have a list of speakers:
    Try to get a model by the collection and id in the element. This
    model needs to have a 'list_of_speakers_id'. This list of speakers
    must exist. The first matching element is taken.
    """
    elements = projector["elements"]
    list_of_speakers_id = None
    for element in elements:
        if "id" not in element:
            continue
        collection = element["name"]
        id = element["id"]
        if collection not in all_data or id not in all_data[collection]:
            continue

        model = all_data[collection][id]
        if "list_of_speakers_id" not in model:
            continue

        if not model["list_of_speakers_id"] in all_data["agenda/list-of-speakers"]:
            continue

        list_of_speakers_id = model["list_of_speakers_id"]
        break

    return list_of_speakers_id


async def get_reference_projector(
    all_data: AllData, projector_id: int
) -> Dict[str, Any]:
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


async def current_list_of_speakers_slide(
    all_data: AllData, element: Dict[str, Any], projector_id: int
) -> Dict[str, Any]:
    """
    The current list of speakers slide. Creates the data for the given projector.
    """
    reference_projector = await get_reference_projector(all_data, projector_id)
    list_of_speakers_id = await get_current_list_of_speakers_id_for_projector(
        all_data, reference_projector
    )
    if list_of_speakers_id is None:  # no element found
        return {}

    return await get_list_of_speakers_slide_data(all_data, list_of_speakers_id)


async def current_speaker_chyron_slide(
    all_data: AllData, element: Dict[str, Any], projector_id: int
) -> Dict[str, Any]:
    """
    Returns the username for the current speaker.
    """
    # get projector for color information
    projector = all_data["core/projector"][projector_id]

    slide_data = {
        "background_color": projector["chyron_background_color"],
        "font_color": projector["chyron_font_color"],
    }

    reference_projector = await get_reference_projector(all_data, projector_id)
    list_of_speakers_id = await get_current_list_of_speakers_id_for_projector(
        all_data, reference_projector
    )
    if list_of_speakers_id is None:  # no element found
        return slide_data

    # get list of speakers to search current speaker
    try:
        list_of_speakers = all_data["agenda/list-of-speakers"][list_of_speakers_id]
    except KeyError:
        raise ProjectorElementException(
            f"List of speakers {list_of_speakers_id} does not exist"
        )

    # find current speaker
    current_speaker = None
    for speaker in list_of_speakers["speakers"]:
        if speaker["begin_time"] is not None and speaker["end_time"] is None:
            current_speaker = await get_user_name(all_data, speaker["user_id"])
            break

    if current_speaker is not None:
        slide_data["current_speaker"] = current_speaker

    return slide_data


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
