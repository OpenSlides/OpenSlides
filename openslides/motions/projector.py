from typing import Any, Dict

from ..users.projector import get_user_name
from ..utils.projector import (
    AllData,
    ProjectorElementException,
    get_config,
    register_projector_slide,
)


# Important: All functions have to be prune. This means, that thay can only
#            access the data, that they get as argument and do not have any
#            side effects. They are called from an async context. So they have
#            to be fast!


def get_state(
    all_data: AllData, motion: Dict[str, Any], state_id: int
) -> Dict[str, Any]:
    """
    Returns a state element from one motion.

    Returns an error if the state_id does not exist for the workflow in the motion.
    """
    states = all_data["motions/workflow"][motion["workflow_id"]]["states"]
    for state in states:
        if state["id"] == state_id:
            return state
    raise ProjectorElementException(
        f"motion {motion['id']} can not be on the state with id {state_id}"
    )


def motion_slide(all_data: AllData, element: Dict[str, Any]) -> Dict[str, Any]:
    """
    Motion slide.

    The returned dict can contain the following fields:
    * identifier
    * title
    * text
    * amendment_paragraphs
    * is_child
    * show_meta_box
    * reason
    * modified_final_version
    * state
    * state_extension
    * recommendation
    * recommendation_extension
    * submitter
    * poll
    """
    mode = element.get("mode")
    motion_id = element.get("id")

    if motion_id is None:
        return {"error": "id is required for motion slide"}

    try:
        motion = all_data["motions/motion"][motion_id]
    except KeyError:
        raise ProjectorElementException(f"motion with id {motion_id} does not exist")

    show_meta_box = not get_config(all_data, "motions_disable_sidebox_on_projector")

    return_value = {
        "identifier": motion["identifier"],
        "title": motion["title"],
        "text": motion["text"],
        "amendment_paragraphs": motion["amendment_paragraphs"],
        "is_child": bool(motion["parent_id"]),
        "show_meta_box": show_meta_box,
    }

    if not get_config(all_data, "motions_disable_reason_on_projector"):
        return_value["reason"] = motion["reason"]

    if mode == "final":
        return_value["modified_final_version"] = motion["modified_final_version"]

    if show_meta_box:
        state = get_state(all_data, motion, motion["state_id"])
        return_value["state"] = state["name"]
        if state["show_state_extension_field"]:
            return_value["state_extension"] = motion["state_extension"]

        if (
            not get_config(all_data, "motions_disable_recommendation_on_projector")
            and motion["recommendation_id"]
        ):
            recommendation_state = get_state(
                all_data, motion, motion["recommendation_id"]
            )
            return_value["recommendation"] = recommendation_state[
                "recommendation_label"
            ]
            if recommendation_state["show_recommendation_extension_field"]:
                return_value["recommendation_extension"] = motion[
                    "recommendation_extension"
                ]

            return_value["change_recommendations"] = motion["change_recommendations"]

        return_value["submitter"] = [
            get_user_name(all_data, submitter["user_id"])
            for submitter in sorted(
                motion["submitters"], key=lambda submitter: submitter["weight"]
            )
        ]

        for poll in motion["polls"][::-1]:
            if poll["has_votes"]:
                return_value["poll"] = {
                    "yes": poll["yes"],
                    "no": poll["no"],
                    "abstain": poll["abstain"],
                }
                break

    return return_value


def motion_block_slide(all_data: AllData, element: Dict[str, Any]) -> Dict[str, Any]:
    """
    Motion slide.
    """
    return {"error": "TODO"}


def register_projector_slides() -> None:
    register_projector_slide("motions/motion", motion_slide)
    register_projector_slide("motions/motion-block", motion_block_slide)
