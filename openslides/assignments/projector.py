from typing import Any, Dict, List

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


def get_assignment(all_data: AllData, id: Any) -> Dict[str, Any]:
    if id is None:
        raise ProjectorElementException("id is required for assignment slide")

    try:
        assignment = all_data["assignments/assignment"][id]
    except KeyError:
        raise ProjectorElementException(f"assignment with id {id} does not exist")
    return assignment


async def assignment_slide(
    all_data: AllData, element: Dict[str, Any], projector_id: int
) -> Dict[str, Any]:
    """
    Assignment slide.
    """
    assignment = get_assignment(all_data, element.get("id"))

    assignment_related_users: List[Dict[str, Any]] = [
        {
            "user": await get_user_name(all_data, aru["user_id"]),
            "elected": aru["elected"],
        }
        for aru in sorted(
            assignment["assignment_related_users"], key=lambda aru: aru["weight"]
        )
    ]

    return {
        "title": assignment["title"],
        "phase": assignment["phase"],
        "open_posts": assignment["open_posts"],
        "description": assignment["description"],
        "assignment_related_users": assignment_related_users,
    }


async def poll_slide(
    all_data: AllData, element: Dict[str, Any], projector_id: int
) -> Dict[str, Any]:
    """
    Poll slide.
    """
    assignment = get_assignment(all_data, element.get("assignment_id"))

    # get poll
    poll_id = element.get("poll_id")
    if poll_id is None:
        raise ProjectorElementException("id is required for poll slide")

    poll = None
    for p in assignment["polls"]:
        if p["id"] == poll_id:
            poll = p
            break
    if poll is None:
        raise ProjectorElementException(f"poll with id {poll_id} does not exist")

    poll_data = {"published": poll["published"]}

    if poll["published"]:
        poll_data["description"] = poll["description"]
        poll_data["has_votes"] = poll["has_votes"]
        poll_data["pollmethod"] = poll["pollmethod"]
        poll_data["votesno"] = poll["votesno"]
        poll_data["votesabstain"] = poll["votesabstain"]
        poll_data["votesvalid"] = poll["votesvalid"]
        poll_data["votesinvalid"] = poll["votesinvalid"]
        poll_data["votescast"] = poll["votescast"]

        poll_data["options"] = [
            {
                "user": await get_user_name(all_data, option["candidate_id"]),
                "is_elected": option["is_elected"],
                "votes": option["votes"],
            }
            for option in sorted(poll["options"], key=lambda option: option["weight"])
        ]

    return {
        "title": assignment["title"],
        "assignments_poll_100_percent_base": await get_config(
            all_data, "assignments_poll_100_percent_base"
        ),
        "poll": poll_data,
    }


def register_projector_slides() -> None:
    register_projector_slide("assignments/assignment", assignment_slide)
    register_projector_slide("assignments/poll", poll_slide)
