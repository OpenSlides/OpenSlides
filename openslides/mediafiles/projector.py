from typing import Any, Dict

from ..utils.projector import (
    AllData,
    ProjectorElementException,
    register_projector_slide,
)


# Important: All functions have to be prune. This means, that thay can only
#            access the data, that they get as argument and do not have any
#            side effects.


async def mediafile_slide(
    all_data: AllData, element: Dict[str, Any], projector_id: int
) -> Dict[str, Any]:
    """
    Slide for Mediafile.
    """
    mediafile_id = element.get("id")

    if mediafile_id is None:
        raise ProjectorElementException("id is required for mediafile slide")

    try:
        mediafile = all_data["mediafiles/mediafile"][mediafile_id]
    except KeyError:
        raise ProjectorElementException(
            f"mediafile with id {mediafile_id} does not exist"
        )

    return {
        "path": mediafile["path"],
        "type": mediafile["mediafile"]["type"],
        "media_url_prefix": mediafile["media_url_prefix"],
    }


def register_projector_slides() -> None:
    register_projector_slide("mediafiles/mediafile", mediafile_slide)
