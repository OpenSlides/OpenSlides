from typing import Any, Dict, List

from ..users.projector import get_user_name
from ..utils.projector import AllData, get_model, get_models, register_projector_slide
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
        {"user": await get_user_name(all_data, aru["user_id"])}
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
        "number_poll_candidates": assignment["number_poll_candidates"],
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
    options = get_models(all_data, "assignments/assignment-option", poll["options_id"])
    for option in sorted(options, key=lambda option: option["weight"]):
        option_data: Dict[str, Any] = {
            "user": {"full_name": await get_user_name(all_data, option["user_id"])}
        }
        if poll["state"] == AssignmentPoll.STATE_PUBLISHED:
            option_data["yes"] = float(option["yes"])
            option_data["no"] = float(option["no"])
            option_data["abstain"] = float(option["abstain"])
        poll_data["options"].append(option_data)

    if poll["state"] == AssignmentPoll.STATE_PUBLISHED:
        poll_data["amount_global_no"] = (
            float(poll["amount_global_no"]) if poll["amount_global_no"] else None
        )
        poll_data["amount_global_abstain"] = (
            float(poll["amount_global_abstain"]) if poll["amount_global_abstain"] else None
        )
        poll_data["votesvalid"] = float(poll["votesvalid"])
        poll_data["votesinvalid"] = float(poll["votesinvalid"])
        poll_data["votescast"] = float(poll["votescast"])

    return {
        "assignment": {"title": assignment["title"]},
        "poll": poll_data,
    }


def register_projector_slides() -> None:
    register_projector_slide("assignments/assignment", assignment_slide)
    register_projector_slide("assignments/assignment-poll", assignment_poll_slide)
