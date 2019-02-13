from typing import Any, Dict

from ..utils.projector import (
    AllData,
    ProjectorElementException,
    register_projector_slide,
)


# Important: All functions have to be prune. This means, that thay can only
#            access the data, that they get as argument and do not have any
#            side effects. They are called from an async context. So they have
#            to be fast!


def topic_slide(all_data: AllData, element: Dict[str, Any]) -> Dict[str, Any]:
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

    return {"title": topic["title"], "text": topic["text"]}


def register_projector_slides() -> None:
    register_projector_slide("topics/topic", topic_slide)
