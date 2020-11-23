from typing import Any, Dict, List

from ..users.projector import get_user_name
from ..utils.projector import (
    ProjectorAllDataProvider,
    get_model,
    get_models,
    register_projector_slide,
)
from .models import AssignmentPoll


async def assignment_slide(
    all_data_provider: ProjectorAllDataProvider,
    element: Dict[str, Any],
    projector_id: int,
) -> Dict[str, Any]:
    """
    Assignment slide.
    """
    assignment = await get_model(
        all_data_provider, "assignments/assignment", element.get("id")
    )

    assignment_related_users: List[Dict[str, Any]] = [
        {"user": await get_user_name(all_data_provider, aru["user_id"])}
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
    all_data_provider: ProjectorAllDataProvider,
    element: Dict[str, Any],
    projector_id: int,
) -> Dict[str, Any]:
    """
    Poll slide.
    """
    poll = await get_model(
        all_data_provider, "assignments/assignment-poll", element.get("id")
    )
    assignment = await get_model(
        all_data_provider, "assignments/assignment", poll["assignment_id"]
    )

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
    options = await get_models(
        all_data_provider, "assignments/assignment-option", poll["options_id"]
    )
    for option in sorted(options, key=lambda option: option["weight"]):
        option_data: Dict[str, Any] = {
            "user": {
                "short_name": await get_user_name(all_data_provider, option["user_id"])
            }
        }
        if poll["state"] == AssignmentPoll.STATE_PUBLISHED:
            option_data["yes"] = float(option["yes"])
            option_data["no"] = float(option["no"])
            option_data["abstain"] = float(option["abstain"])
        poll_data["options"].append(option_data)

    if poll["state"] == AssignmentPoll.STATE_PUBLISHED:
        poll_data["amount_global_yes"] = (
            float(poll["amount_global_yes"]) if poll["amount_global_yes"] else None
        )
        poll_data["amount_global_no"] = (
            float(poll["amount_global_no"]) if poll["amount_global_no"] else None
        )
        poll_data["amount_global_abstain"] = (
            float(poll["amount_global_abstain"])
            if poll["amount_global_abstain"]
            else None
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
