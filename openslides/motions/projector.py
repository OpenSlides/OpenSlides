import re
from typing import Any, Dict, List, Optional

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
    all_data: AllData, motion: Dict[str, Any], state_id_key: str
) -> Dict[str, Any]:
    """
    Returns a state element from one motion. Raises an error if the state does not exist.
    """
    state = all_data["motions/state"].get(motion[state_id_key])
    if not state:
        raise ProjectorElementException(
            f"motion {motion['id']} can not be on the state with id {motion[state_id_key]}"
        )
    return state


async def get_amendment_merge_into_motion_diff(all_data, amendment):
    """
    HINT: This implementation should be consistent to showInDiffView() in ViewMotionAmendedParagraph.ts
    """
    if amendment["state_id"] is None:
        return 0

    state = await get_state(all_data, amendment, "state_id")
    if state["merge_amendment_into_final"] == -1:
        return 0
    if state["merge_amendment_into_final"] == 1:
        return 1

    if amendment["recommendation_id"] is None:
        return 0
    recommendation = await get_state(all_data, amendment, "recommendation_id")
    if recommendation["merge_amendment_into_final"] == 1:
        return 1

    return 0


async def get_amendment_merge_into_motion_final(all_data, amendment):
    """
    HINT: This implementation should be consistent to showInFinalView() in ViewMotionAmendedParagraph.ts
    """
    if amendment["state_id"] is None:
        return 0

    state = await get_state(all_data, amendment, "state_id")
    if state["merge_amendment_into_final"] == 1:
        return 1

    return 0


async def get_amendments_for_motion(motion, all_data):
    amendment_data = []
    for amendment_id, amendment in all_data["motions/motion"].items():
        if amendment["parent_id"] == motion["id"]:
            merge_amendment_into_final = await get_amendment_merge_into_motion_final(
                all_data, amendment
            )
            merge_amendment_into_diff = await get_amendment_merge_into_motion_diff(
                all_data, amendment
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
    * show_referring_motions
    * reason
    * modified_final_version
    * recommendation
    * recommendation_extension
    * recommender
    * change_recommendations
    * submitter
    """
    # Get motion
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

    # Get some needed config values
    show_meta_box = not await get_config(
        all_data, "motions_disable_sidebox_on_projector"
    )
    show_referring_motions = not await get_config(
        all_data, "motions_hide_referring_motions"
    )
    line_length = await get_config(all_data, "motions_line_length")
    line_numbering_mode = await get_config(all_data, "motions_default_line_numbering")
    motions_preamble = await get_config(all_data, "motions_preamble")

    # Query all change-recommendation and amendment related things.
    change_recommendations = []  # type: ignore
    amendments = []  # type: ignore
    base_motion = None
    base_statute = None
    if motion["statute_paragraph_id"]:
        base_statute = await get_amendment_base_statute(motion, all_data)
    elif motion["parent_id"] is not None and motion["amendment_paragraphs"]:
        base_motion = await get_amendment_base_motion(motion, all_data)
    else:
        for change_recommendation_id in motion["change_recommendations_id"]:
            cr = all_data["motions/motion-change-recommendation"].get(
                change_recommendation_id
            )
            if cr is not None and not cr["internal"]:
                change_recommendations.append(cr)
        amendments = await get_amendments_for_motion(motion, all_data)

    # The base return value. More fields will get added below.
    return_value = {
        "identifier": motion["identifier"],
        "title": motion["title"],
        "preamble": motions_preamble,
        "amendment_paragraphs": motion["amendment_paragraphs"],
        "base_motion": base_motion,
        "base_statute": base_statute,
        "is_child": bool(motion["parent_id"]),
        "show_meta_box": show_meta_box,
        "show_referring_motions": show_referring_motions,
        "change_recommendations": change_recommendations,
        "amendments": amendments,
        "line_length": line_length,
        "line_numbering_mode": line_numbering_mode,
    }

    if not await get_config(all_data, "motions_disable_text_on_projector"):
        return_value["text"] = motion["text"]

    if not await get_config(all_data, "motions_disable_reason_on_projector"):
        return_value["reason"] = motion["reason"]

    if mode == "final":
        return_value["modified_final_version"] = motion["modified_final_version"]

    if show_meta_box:
        # Add recommendation, if enabled in config (and the motion has one)
        if (
            not await get_config(
                all_data, "motions_disable_recommendation_on_projector"
            )
            and motion["recommendation_id"]
        ):
            recommendation_state = await get_state(
                all_data, motion, "recommendation_id"
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

        # Add submitters
        return_value["submitter"] = [
            await get_user_name(all_data, submitter["user_id"])
            for submitter in sorted(
                motion["submitters"], key=lambda submitter: submitter["weight"]
            )
        ]

    if show_referring_motions:
        # Add recommendation-referencing motions
        return_value[
            "recommendation_referencing_motions"
        ] = await get_recommendation_referencing_motions(all_data, motion_id)

    return return_value


async def get_recommendation_referencing_motions(
    all_data: AllData, motion_id: int
) -> Optional[List[Dict[str, Any]]]:
    """
    Returns all title information for motions, that are referencing
    the given motion (by id) in their recommendation. If there are no
    motions, None is returned (instead of []).
    """
    recommendation_referencing_motions = []
    for motion in all_data["motions/motion"].values():
        # Motion must have a recommendation and a recommendaiton extension
        if not motion["recommendation_id"] or not motion["recommendation_extension"]:
            continue

        # The recommendation must allow the extension field (there might be left-overs
        # in a motions recommendation extension..)
        recommendation = await get_state(all_data, motion, "recommendation_id")
        if not recommendation["show_recommendation_extension_field"]:
            continue

        # Find referenced motion ids
        referenced_ids = [
            int(id)
            for id in motion_placeholder_regex.findall(
                motion["recommendation_extension"]
            )
        ]

        # if one of the referenced ids is the given motion, add the current motion.
        if motion_id in referenced_ids:
            recommendation_referencing_motions.append(
                {"title": motion["title"], "identifier": motion["identifier"]}
            )
    return recommendation_referencing_motions or None


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
                recommendation = await get_state(all_data, motion, "recommendation_id")
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
