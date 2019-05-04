from typing import Any, Dict, List

from ..utils.projector import (
    AllData,
    ProjectorElementException,
    register_projector_slide,
)


# Important: All functions have to be prune. This means, that thay can only
#            access the data, that they get as argument and do not have any
#            side effects.


async def user_slide(
    all_data: AllData, element: Dict[str, Any], projector_id: int
) -> Dict[str, Any]:
    """
    User slide.

    The returned dict can contain the following fields:
    * user
    """
    user_id = element.get("id")

    if user_id is None:
        raise ProjectorElementException("id is required for user slide")

    return {"user": await get_user_name(all_data, user_id)}


async def get_user_name(all_data: AllData, user_id: int) -> str:
    """
    Returns the short name for an user_id.
    """
    try:
        user = all_data["users/user"][user_id]
    except KeyError:
        raise ProjectorElementException(f"user with id {user_id} does not exist")

    name_parts: List[str] = []
    for name_part in ("title", "first_name", "last_name"):
        if user[name_part]:
            name_parts.append(user[name_part])
    if not name_part:
        name_parts.append(user["username"])
    if user["structure_level"]:
        name_parts.append(f"({user['structure_level']})")
    return " ".join(name_parts)


def register_projector_slides() -> None:
    register_projector_slide("users/user", user_slide)
