from typing import Any, Dict

from ..utils.projector import (
    ProjectorAllDataProvider,
    get_model,
    register_projector_slide,
)


async def poster_slide(
    all_data_provider: ProjectorAllDataProvider,
    element: Dict[str, Any],
    projector_id: int,
) -> Dict[str, Any]:
    """
    Poster slide.

    The returned dict contains the following fields:
    * title
    * xml
    """
    poster = await get_model(all_data_provider, "posters/poster", element.get("id"))
    return {
        "title": poster["title"],
        "xml": poster["xml"],
    }


def register_projector_slides() -> None:
    register_projector_slide("posters/poster", poster_slide)
