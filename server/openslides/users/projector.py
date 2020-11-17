from typing import Any, Dict, List, Optional

from ..utils.projector import (
    ProjectorAllDataProvider,
    get_model,
    register_projector_slide,
)


async def user_slide(
    all_data_provider: ProjectorAllDataProvider,
    element: Dict[str, Any],
    projector_id: int,
) -> Dict[str, Any]:
    """
    User slide.

    The returned dict can contain the following fields:
    * user
    """
    return {"user": await get_user_name(all_data_provider, element.get("id"))}


async def get_user_name(
    all_data_provider: ProjectorAllDataProvider, user_id: Optional[int]
) -> str:
    """
    Returns the short name for an user_id.
    """
    user = await get_model(all_data_provider, "users/user", user_id)

    name_parts: List[str] = []
    for name_part in ("title", "first_name", "last_name"):
        if user[name_part]:
            name_parts.append(user[name_part])
    if not name_parts:
        name_parts.append(user["username"])
    if user["structure_level"]:
        name_parts.append(f"({user['structure_level']})")
    return " ".join(name_parts)


def register_projector_slides() -> None:
    register_projector_slide("users/user", user_slide)
