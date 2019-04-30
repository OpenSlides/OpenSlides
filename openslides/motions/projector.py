import re
from typing import Any, Dict, Optional

from ..users.projector import get_user_name
from ..utils.projector import (
    AllData,
    ProjectorElementException,
    get_config,
    register_projector_slide,
)


motion_placeholder_regex = re.compile(r"\[motion:(\d+)\]")

# Important: All functions have to be prune. This means, that thay can only
#            access the data, that they get as argument and do not have any
#            side effects.


async def get_state(
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


async def get_amendment_merge_into_motion_diff(all_data, motion, amendment):
    """
    HINT: This implementation should be consistent to showInDiffView() in ViewMotionAmendedParagraph.ts
    """
    if amendment["state_id"] is None:
        return 0

    state = await get_state(all_data, motion, amendment["state_id"])
    if state["merge_amendment_into_final"] == -1:
        return 0
    if state["merge_amendment_into_final"] == 1:
        return 1

    if amendment["recommendation_id"] is None:
        return 0
    recommendation = await get_state(all_data, motion, amendment["recommendation_id"])
    if recommendation["merge_amendment_into_final"] == 1:
        return 1

    return 0


async def get_amendment_merge_into_motion_final(all_data, motion, amendment):
    """
    HINT: This implementation should be consistent to showInFinalView() in ViewMotionAmendedParagraph.ts
    """
    if amendment["state_id"] is None:
        return 0

    state = await get_state(all_data, motion, amendment["state_id"])
    if state["merge_amendment_into_final"] == 1:
        return 1

    return 0


async def get_amendments_for_motion(motion, all_data):
    amendment_data = []
    for amendment_id, amendment in all_data["motions/motion"].items():
        if amendment["parent_id"] == motion["id"]:
            merge_amendment_into_final = await get_amendment_merge_into_motion_final(
                all_data, motion, amendment
            )
            merge_amendment_into_diff = await get_amendment_merge_into_motion_diff(
                all_data, motion, amendment
            )
            amendment_data.append(
                {
                    "id": amendment["id"],
                    "identifier": amendment["identifier"],
                    "title": amendment["title"],
                    "amendment_paragraphs": amendment["amendment_paragraphs"],
                    "merge_amendment_into_diff": merge_amendment_into_diff,
                    "merge_amendment_into_final": merge_amendment_into_final,
                }
            )
    return amendment_data


async def get_amendment_base_motion(amendment, all_data):
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


async def get_amendment_base_statute(amendment, all_data):
    try:
        statute = all_data["motions/statute-paragraph"][
            amendment["statute_paragraph_id"]
        ]
    except KeyError:
        statute_id = amendment["statute_paragraph_id"]
        raise ProjectorElementException(f"statute with id {statute_id} does not exist")

    return {"title": statute["title"], "text": statute["text"]}


async def extend_reference_motion_dict(
    all_data: AllData,
    recommendation: Optional[str],
    referenced_motions: Dict[int, Dict[str, str]],
) -> None:
    """
    Extends a dict of motion ids mapped to their title information.
    The client can replace the placeholders in the recommendation correctly.
    """
    if recommendation is None:
        return

    # Collect all meantioned motions via [motion:<id>]
    referenced_ids = [
        int(id) for id in motion_placeholder_regex.findall(recommendation)
    ]
    for id in referenced_ids:
        # Put every referenced motion into the referenced_motions dict
        if id not in referenced_motions and id in all_data["motions/motion"]:
            referenced_motions[id] = {
                "title": all_data["motions/motion"][id]["title"],
                "identifier": all_data["motions/motion"][id]["identifier"],
            }


async def motion_slide(
    all_data: AllData, element: Dict[str, Any], projector_id: int
) -> Dict[str, Any]:
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
    mode = element.get(
        "mode", await get_config(all_data, "motions_recommendation_text_mode")
    )
    motion_id = element.get("id")

    if motion_id is None:
        raise ProjectorElementException("id is required for motion slide")

    try:
        motion = all_data["motions/motion"][motion_id]
    except KeyError:
        raise ProjectorElementException(f"motion with id {motion_id} does not exist")

    show_meta_box = not await get_config(
        all_data, "motions_disable_sidebox_on_projector"
    )
    line_length = await get_config(all_data, "motions_line_length")
    line_numbering_mode = await get_config(all_data, "motions_default_line_numbering")
    motions_preamble = await get_config(all_data, "motions_preamble")

    if motion["statute_paragraph_id"]:
        change_recommendations = []  # type: ignore
        amendments = []  # type: ignore
        base_motion = None
        base_statute = await get_amendment_base_statute(motion, all_data)
    elif bool(motion["parent_id"]) and motion["amendment_paragraphs"]:
        change_recommendations = []
        amendments = []
        base_motion = await get_amendment_base_motion(motion, all_data)
        base_statute = None
    else:
        change_recommendations = list(
            filter(
                lambda reco: reco["internal"] is False, motion["change_recommendations"]
            )
        )
        amendments = await get_amendments_for_motion(motion, all_data)
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

    if not await get_config(all_data, "motions_disable_reason_on_projector"):
        return_value["reason"] = motion["reason"]

    if mode == "final":
        return_value["modified_final_version"] = motion["modified_final_version"]

    if show_meta_box:
        if (
            not await get_config(
                all_data, "motions_disable_recommendation_on_projector"
            )
            and motion["recommendation_id"]
        ):
            recommendation_state = await get_state(
                all_data, motion, motion["recommendation_id"]
            )
            return_value["recommendation"] = recommendation_state[
                "recommendation_label"
            ]
            if recommendation_state["show_recommendation_extension_field"]:
                recommendation_extension = motion["recommendation_extension"]
                # All title information for referenced motions in the recommendation
                referenced_motions: Dict[int, Dict[str, str]] = {}
                await extend_reference_motion_dict(
                    all_data, recommendation_extension, referenced_motions
                )
                return_value["recommendation_extension"] = recommendation_extension
                return_value["referenced_motions"] = referenced_motions

            return_value["recommender"] = await get_config(
                all_data, "motions_recommendations_by"
            )

        return_value["submitter"] = [
            await get_user_name(all_data, submitter["user_id"])
            for submitter in sorted(
                motion["submitters"], key=lambda submitter: submitter["weight"]
            )
        ]

    return return_value


async def motion_block_slide(
    all_data: AllData, element: Dict[str, Any], projector_id: int
) -> Dict[str, Any]:
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

    # All motions in this motion block
    motions = []

    # All title information for referenced motions in the recommendation
    referenced_motions: Dict[int, Dict[str, str]] = {}

    # Search motions.
    for motion in all_data["motions/motion"].values():
        if motion["motion_block_id"] == motion_block_id:
            motion_object = {
                "title": motion["title"],
                "identifier": motion["identifier"],
            }

            recommendation_id = motion["recommendation_id"]
            if recommendation_id is not None:
                recommendation = await get_state(
                    all_data, motion, motion["recommendation_id"]
                )
                motion_object["recommendation"] = {
                    "name": recommendation["recommendation_label"],
                    "css_class": recommendation["css_class"],
                }
                if recommendation["show_recommendation_extension_field"]:
                    recommendation_extension = motion["recommendation_extension"]
                    await extend_reference_motion_dict(
                        all_data, recommendation_extension, referenced_motions
                    )
                    motion_object["recommendation_extension"] = recommendation_extension

            motions.append(motion_object)

    return {
        "title": motion_block["title"],
        "motions": motions,
        "referenced_motions": referenced_motions,
    }


def register_projector_slides() -> None:
    register_projector_slide("motions/motion", motion_slide)
    register_projector_slide("motions/motion-block", motion_block_slide)
