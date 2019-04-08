from typing import Any, Dict

from ..utils.projector import (
    AllData,
    ProjectorElementException,
    register_projector_slide,
)


# Important: All functions have to be prune. This means, that thay can only
#            access the data, that they get as argument and do not have any
#            side effects.


async def topic_slide(
    all_data: AllData, element: Dict[str, Any], projector_id: int
) -> Dict[str, Any]:
    """
    Topic slide.

    The returned dict can contain the following fields:
    * title
    * text
    """
    topic_id = element.get("id")

    if topic_id is None:
        raise ProjectorElementException("id is required for topic slide")

    try:
        topic = all_data["topics/topic"][topic_id]
    except KeyError:
        raise ProjectorElementException(f"topic with id {topic_id} does not exist")

    item_id = topic["agenda_item_id"]
    try:
        item = all_data["agenda/item"][item_id]
    except KeyError:
        raise ProjectorElementException(f"item with id {item_id} does not exist")

    return {
        "title": topic["title"],
        "text": topic["text"],
        "item_number": item["item_number"],
    }


def register_projector_slides() -> None:
    register_projector_slide("topics/topic", topic_slide)
