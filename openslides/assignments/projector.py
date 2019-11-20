from typing import Any, Dict, List

from ..users.projector import get_user_name
from ..utils.projector import AllData, get_model, register_projector_slide
from .models import AssignmentPoll


# Important: All functions have to be prune. This means, that thay can only
#            access the data, that they get as argument and do not have any
#            side effects.


async def assignment_slide(
    all_data: AllData, element: Dict[str, Any], projector_id: int
) -> Dict[str, Any]:
    """
    Assignment slide.
    """
    assignment = get_model(all_data, "assignments/assignment", element.get("id"))

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


async def assignment_poll_slide(
    all_data: AllData, element: Dict[str, Any], projector_id: int
) -> Dict[str, Any]:
    """
    Poll slide.
    """
    poll = get_model(all_data, "assignments/assignment-poll", element.get("id"))
    assignment = get_model(all_data, "assignments/assignment", poll["assignment_id"])

    poll_data = {
        key: poll[key]
        for key in (
            "title",
            "type",
            "pollmethod",
            "votes_amount",
            "description",
            "state",
            "onehundred_percent_base",
            "majority_method",
        )
    }

    # Add options:
    poll_data["options"] = []
    for option in sorted(poll["options"], key=lambda option: option["weight"]):
        option_data = {"user": await get_user_name(all_data, option["user_id"])}
        if poll["state"] == AssignmentPoll.STATE_PUBLISHED:
            option_data["yes"] = option["yes"]
            option_data["no"] = option["no"]
            option_data["abstain"] = option["abstain"]
        poll_data["options"].append(option_data)

    if poll["state"] == AssignmentPoll.STATE_PUBLISHED:
        poll_data["amount_global_no"] = poll["amount_global_no"]
        poll_data["amount_global_abstain"] = poll["amount_global_abstain"]
        poll_data["votesvalid"] = poll["votesvalid"]
        poll_data["votesinvalid"] = poll["votesinvalid"]
        poll_data["votescast"] = poll["votescast"]

    return {
        "assignment": {"title": assignment["title"]},
        "poll": poll_data,
    }


def register_projector_slides() -> None:
    register_projector_slide("assignments/assignment", assignment_slide)
    register_projector_slide("assignments/assignment-poll", assignment_poll_slide)
