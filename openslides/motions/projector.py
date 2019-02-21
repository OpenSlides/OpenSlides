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


def get_amendment_merge_into_motion(all_data, motion, amendment):
    """
    HINT: This implementation should be consistent to isAccepted() in ViewMotionAmendedParagraph.ts
    """
    if amendment["state_id"] is None:
        return 0

    state = get_state(all_data, motion, amendment["state_id"])
    if (
        state["merge_amendment_into_final"] == -1
        or state["merge_amendment_into_final"] == 1
    ):
        return state["merge_amendment_into_final"]

    if amendment["recommendation_id"] is None:
        return 0
    recommendation = get_state(all_data, motion, amendment["recommendation_id"])
    return recommendation["merge_amendment_into_final"]


def get_amendments_for_motion(motion, all_data):
    amendment_data = []
    for amendment_id, amendment in all_data["motions/motion"].items():
        if amendment["parent_id"] == motion["id"]:
            merge_amendment_into_final = get_amendment_merge_into_motion(
                all_data, motion, amendment
            )
            amendment_data.append(
                {
                    "id": amendment["id"],
                    "identifier": amendment["identifier"],
                    "title": amendment["title"],
                    "amendment_paragraphs": amendment["amendment_paragraphs"],
                    "merge_amendment_into_final": merge_amendment_into_final,
                }
            )
    return amendment_data


def get_amendment_base_motion(amendment, all_data):
    try:
        motion = all_data["motions/motion"][amendment["parent_id"]]
    except KeyError:
        motion_id = amendment["parent_id"]
        raise ProjectorElementException(f"motion with id {motion_id} does not exist")

    return {
        "identifier": motion["identifier"],
        "title": motion["title"],
        "text": motion["text"],
    }


def get_amendment_base_statute(amendment, all_data):
    try:
        statute = all_data["motions/statute-paragraph"][
            amendment["statute_paragraph_id"]
        ]
    except KeyError:
        statute_id = amendment["statute_paragraph_id"]
        raise ProjectorElementException(f"statute with id {statute_id} does not exist")

    return {"title": statute["title"], "text": statute["text"]}


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
    * recommendation
    * recommendation_extension
    * recommender
    * change_recommendations
    * submitter
    """
    mode = element.get("mode", get_config(all_data, "motions_recommendation_text_mode"))
    motion_id = element.get("id")

    if motion_id is None:
        raise ProjectorElementException("id is required for motion slide")

    try:
        motion = all_data["motions/motion"][motion_id]
    except KeyError:
        raise ProjectorElementException(f"motion with id {motion_id} does not exist")

    show_meta_box = not get_config(all_data, "motions_disable_sidebox_on_projector")
    line_length = get_config(all_data, "motions_line_length")
    line_numbering_mode = get_config(all_data, "motions_default_line_numbering")
    motions_preamble = get_config(all_data, "motions_preamble")

    if motion["statute_paragraph_id"]:
        change_recommendations = []  # type: ignore
        amendments = []  # type: ignore
        base_motion = None
        base_statute = get_amendment_base_statute(motion, all_data)
    elif bool(motion["parent_id"]) and motion["amendment_paragraphs"]:
        change_recommendations = []
        amendments = []
        base_motion = get_amendment_base_motion(motion, all_data)
        base_statute = None
    else:
        change_recommendations = list(
            filter(
                lambda reco: reco["internal"] is False, motion["change_recommendations"]
            )
        )
        amendments = get_amendments_for_motion(motion, all_data)
        base_motion = None
        base_statute = None

    return_value = {
        "identifier": motion["identifier"],
        "title": motion["title"],
        "preamble": motions_preamble,
        "text": motion["text"],
        "amendment_paragraphs": motion["amendment_paragraphs"],
        "base_motion": base_motion,
        "base_statute": base_statute,
        "is_child": bool(motion["parent_id"]),
        "show_meta_box": show_meta_box,
        "change_recommendations": change_recommendations,
        "amendments": amendments,
        "line_length": line_length,
        "line_numbering_mode": line_numbering_mode,
    }

    if not get_config(all_data, "motions_disable_reason_on_projector"):
        return_value["reason"] = motion["reason"]

    if mode == "final":
        return_value["modified_final_version"] = motion["modified_final_version"]

    if show_meta_box:
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

            return_value["recommender"] = get_config(
                all_data, "motions_recommendations_by"
            )

        return_value["submitter"] = [
            get_user_name(all_data, submitter["user_id"])
            for submitter in sorted(
                motion["submitters"], key=lambda submitter: submitter["weight"]
            )
        ]

    return return_value


def motion_block_slide(all_data: AllData, element: Dict[str, Any]) -> Dict[str, Any]:
    """
    Motion block slide.
    """
    motion_block_id = element.get("id")

    if motion_block_id is None:
        raise ProjectorElementException("id is required for motion block slide")

    try:
        motion_block = all_data["motions/motion-block"][motion_block_id]
    except KeyError:
        raise ProjectorElementException(
            f"motion block with id {motion_block_id} does not exist"
        )

    motions = []
    for motion in all_data["motions/motion"].values():
        if motion["motion_block_id"] == motion_block_id:
            motion_object = {
                "title": motion["title"],
                "identifier": motion["identifier"],
            }

            recommendation_id = motion["recommendation_id"]
            if recommendation_id is not None:
                recommendation = get_state(
                    all_data, motion, motion["recommendation_id"]
                )
                motion_object["recommendation"] = {
                    "name": recommendation["name"],
                    "css_class": recommendation["css_class"],
                }
                if recommendation["show_recommendation_extension_field"]:
                    motion_object["recommendation_extension"] = motion[
                        "recommendation_extension"
                    ]

            motions.append(motion_object)

    return {"title": motion_block["title"], "motions": motions}


def register_projector_slides() -> None:
    register_projector_slide("motions/motion", motion_slide)
    register_projector_slide("motions/motion-block", motion_block_slide)
