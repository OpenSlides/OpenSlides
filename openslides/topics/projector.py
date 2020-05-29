from typing import Any, Dict

from ..utils.projector import (
    ProjectorAllDataProvider,
    get_model,
    register_projector_slide,
)


async def topic_slide(
    all_data_provider: ProjectorAllDataProvider,
    element: Dict[str, Any],
    projector_id: int,
) -> Dict[str, Any]:
    """
    Topic slide.

    The returned dict can contain the following fields:
    * title
    * text
    """
    topic = await get_model(all_data_provider, "topics/topic", element.get("id"))
    item = await get_model(all_data_provider, "agenda/item", topic["agenda_item_id"])
    return {
        "title": topic["title"],
        "text": topic["text"],
        "item_number": item["item_number"],
    }


def register_projector_slides() -> None:
    register_projector_slide("topics/topic", topic_slide)
