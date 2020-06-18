from typing import Any, Dict

from ..utils.projector import (
    ProjectorAllDataProvider,
    get_model,
    register_projector_slide,
)


async def mediafile_slide(
    all_data_provider: ProjectorAllDataProvider,
    element: Dict[str, Any],
    projector_id: int,
) -> Dict[str, Any]:
    """
    Slide for Mediafile.
    """
    mediafile = await get_model(
        all_data_provider, "mediafiles/mediafile", element.get("id")
    )
    return {
        "path": mediafile["path"],
        "mimetype": mediafile["mimetype"],
        "media_url_prefix": mediafile["media_url_prefix"],
    }


def register_projector_slides() -> None:
    register_projector_slide("mediafiles/mediafile", mediafile_slide)
