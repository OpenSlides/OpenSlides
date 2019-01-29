from typing import Any, Dict, List

from ..utils.projector import AllData, register_projector_slide


# Important: All functions have to be prune. This means, that thay can only
#            access the data, that they get as argument and do not have any
#            side effects. They are called from an async context. So they have
#            to be fast!


def user_slide(all_data: AllData, element: Dict[str, Any]) -> Dict[str, Any]:
    """
    User slide.
    """
    return {"error": "TODO"}


def get_user_name(all_data: AllData, user_id: int) -> str:
    """
    Returns the short name for an user_id.
    """
    user = all_data["users/user"][user_id]
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
