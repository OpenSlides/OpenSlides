import re
from typing import Any, Dict, List, Optional

from ..users.projector import get_user_name
from ..utils.projector import (
    ProjectorAllDataProvider,
    ProjectorElementException,
    get_config,
    get_model,
    register_projector_slide,
)
from .models import MotionPoll


motion_placeholder_regex = re.compile(r"\[motion:(\d+)\]")


async def get_state(
    all_data_provider: ProjectorAllDataProvider,
    motion: Dict[str, Any],
    state_id_key: str,
) -> Dict[str, Any]:
    """
    Returns a state element from one motion. Raises an error if the state does not exist.
    """
    state = await all_data_provider.get("motions/state", motion[state_id_key])
    if state is None:
        raise ProjectorElementException(
            f"motion {motion['id']} can not be on the state with id {motion[state_id_key]}"
        )
    return state


async def get_amendment_merge_into_motion_diff(all_data_provider, amendment):
    """
    HINT: This implementation should be consistent to showInDiffView() in ViewMotionAmendedParagraph.ts
    """
    if amendment["state_id"] is None:
        return 0

    state = await get_state(all_data_provider, amendment, "state_id")
    if state["merge_amendment_into_final"] == -1:
        return 0
    if state["merge_amendment_into_final"] == 1:
        return 1

    if amendment["recommendation_id"] is None:
        return 0
    recommendation = await get_state(all_data_provider, amendment, "recommendation_id")
    if recommendation["merge_amendment_into_final"] == 1:
        return 1

    return 0


async def get_amendment_merge_into_motion_final(all_data_provider, amendment):
    """
    HINT: This implementation should be consistent to showInFinalView() in ViewMotionAmendedParagraph.ts
    """
    if amendment["state_id"] is None:
        return 0

    state = await get_state(all_data_provider, amendment, "state_id")
    if state["merge_amendment_into_final"] == 1:
        return 1

    return 0


async def get_amendments_for_motion(motion, all_data_provider):
    amendment_data = []
    for amendment_id in motion["amendments_id"]:
        amendment = await all_data_provider.get("motions/motion", amendment_id)

        merge_amendment_into_final = await get_amendment_merge_into_motion_final(
            all_data_provider, amendment
        )
        merge_amendment_into_diff = await get_amendment_merge_into_motion_diff(
            all_data_provider, amendment
        )

        # Add change recommendations to the amendments:
        change_recommendations = []  # type: ignore
        for change_recommendation_id in amendment["change_recommendations_id"]:
            cr = await get_model(
                all_data_provider,
                "motions/motion-change-recommendation",
                change_recommendation_id,
            )
            if cr is not None and not cr["internal"] and not cr["rejected"]:
                change_recommendations.append(cr)

        amendment_data.append(
            {
                "id": amendment["id"],
                "identifier": amendment["identifier"],
                "title": amendment["title"],
                "amendment_paragraphs": amendment["amendment_paragraphs"],
                "change_recommendations": change_recommendations,
                "merge_amendment_into_diff": merge_amendment_into_diff,
                "merge_amendment_into_final": merge_amendment_into_final,
            }
        )
    return amendment_data


async def get_amendment_base_motion(amendment, all_data_provider):
    motion = await get_model(
        all_data_provider, "motions/motion", amendment.get("parent_id")
    )

    return {
        "identifier": motion["identifier"],
        "title": motion["title"],
        "text": motion["text"],
    }


async def get_amendment_base_statute(amendment, all_data_provider):
    statute = await get_model(
        all_data_provider,
        "motions/statute-paragraph",
        amendment.get("statute_paragraph_id"),
    )
    return {"title": statute["title"], "text": statute["text"]}


async def extend_reference_motion_dict(
    all_data_provider: ProjectorAllDataProvider,
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
        referenced_motion = await all_data_provider.get("motions/motion", id)
        if id not in referenced_motions and referenced_motion is not None:
            referenced_motions[id] = {
                "title": referenced_motion["title"],
                "identifier": referenced_motion["identifier"],
            }


async def motion_slide(
    all_data_provider: ProjectorAllDataProvider,
    element: Dict[str, Any],
    projector_id: int,
) -> Dict[str, Any]:
    """
    Motion slide.

    The returned dict can contain the following fields:
    * identifier
    * title
    * text
    * submitters
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
    """
    # Get motion
    mode = element.get(
        "mode", await get_config(all_data_provider, "motions_recommendation_text_mode")
    )

    # populate cache:

    motion = await get_model(all_data_provider, "motions/motion", element.get("id"))

    # Add submitters
    submitters = [
        await get_user_name(all_data_provider, submitter["user_id"])
        for submitter in sorted(
            motion["submitters"], key=lambda submitter: submitter["weight"]
        )
    ]

    # Get some needed config values
    show_meta_box = not await get_config(
        all_data_provider, "motions_disable_sidebox_on_projector"
    )
    show_referring_motions = not await get_config(
        all_data_provider, "motions_hide_referring_motions"
    )
    line_length = await get_config(all_data_provider, "motions_line_length")
    line_numbering_mode = await get_config(
        all_data_provider, "motions_default_line_numbering"
    )
    motions_preamble = await get_config(all_data_provider, "motions_preamble")

    # Query all change-recommendation and amendment related things.
    amendments = []  # type: ignore
    base_motion = None
    base_statute = None
    if motion["statute_paragraph_id"]:
        base_statute = await get_amendment_base_statute(motion, all_data_provider)
    elif motion["parent_id"] is not None and motion["amendment_paragraphs"]:
        base_motion = await get_amendment_base_motion(motion, all_data_provider)
    else:
        amendments = await get_amendments_for_motion(motion, all_data_provider)

    change_recommendations = []  # type: ignore
    for change_recommendation_id in motion["change_recommendations_id"]:
        cr = await get_model(
            all_data_provider,
            "motions/motion-change-recommendation",
            change_recommendation_id,
        )
        if cr is not None and not cr["internal"]:
            change_recommendations.append(cr)

    # The base return value. More fields will get added below.
    return_value = {
        "identifier": motion["identifier"],
        "title": motion["title"],
        "submitters": submitters,
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

    if not await get_config(all_data_provider, "motions_disable_text_on_projector"):
        return_value["text"] = motion["text"]

    if not await get_config(all_data_provider, "motions_disable_reason_on_projector"):
        return_value["reason"] = motion["reason"]

    if mode == "final":
        return_value["modified_final_version"] = motion["modified_final_version"]

    # Add recommendation, if enabled in config (and the motion has one)
    if (
        not await get_config(
            all_data_provider, "motions_disable_recommendation_on_projector"
        )
        and motion["recommendation_id"]
    ):
        recommendation_state = await get_state(
            all_data_provider, motion, "recommendation_id"
        )
        return_value["recommendation"] = recommendation_state["recommendation_label"]
        if recommendation_state["show_recommendation_extension_field"]:
            recommendation_extension = motion["recommendation_extension"]
            # All title information for referenced motions in the recommendation
            referenced_motions: Dict[int, Dict[str, str]] = {}
            await extend_reference_motion_dict(
                all_data_provider, recommendation_extension, referenced_motions
            )
            return_value["recommendation_extension"] = recommendation_extension
            return_value["referenced_motions"] = referenced_motions
        if motion["statute_paragraph_id"]:
            return_value["recommender"] = await get_config(
                all_data_provider, "motions_statute_recommendations_by"
            )
        else:
            return_value["recommender"] = await get_config(
                all_data_provider, "motions_recommendations_by"
            )

    if show_referring_motions:
        # Add recommendation-referencing motions
        return_value[
            "recommendation_referencing_motions"
        ] = await get_recommendation_referencing_motions(
            all_data_provider, motion["id"]
        )

    return return_value


async def get_recommendation_referencing_motions(
    all_data_provider: ProjectorAllDataProvider, motion_id: int
) -> Optional[List[Dict[str, Any]]]:
    """
    Returns all title information for motions, that are referencing
    the given motion (by id) in their recommendation. If there are no
    motions, None is returned (instead of []).
    """
    recommendation_referencing_motions = []
    all_motions = await all_data_provider.get_collection("motions/motion")
    for motion in all_motions.values():
        # Motion must have a recommendation and a recommendaiton extension
        if not motion["recommendation_id"] or not motion["recommendation_extension"]:
            continue

        # The recommendation must allow the extension field (there might be left-overs
        # in a motions recommendation extension..)
        recommendation = await get_state(all_data_provider, motion, "recommendation_id")
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
    all_data_provider: ProjectorAllDataProvider,
    element: Dict[str, Any],
    projector_id: int,
) -> Dict[str, Any]:
    """
    Motion block slide.
    """
    motion_block = await get_model(
        all_data_provider, "motions/motion-block", element.get("id")
    )

    # All motions in this motion block
    motions = []

    # All title information for referenced motions in the recommendation
    referenced_motions: Dict[int, Dict[str, str]] = {}

    # iterate motions.
    for motion_id in motion_block["motions_id"]:
        motion = await all_data_provider.get("motions/motion", motion_id)
        # primarily to please mypy, should theoretically not happen
        if motion is None:
            raise RuntimeError(
                f"motion {motion_id} of block {element.get('id')} could not be found"
            )

        motion_object = {
            "title": motion["title"],
            "identifier": motion["identifier"],
        }

        recommendation_id = motion["recommendation_id"]
        if recommendation_id is not None:
            recommendation = await get_state(
                all_data_provider, motion, "recommendation_id"
            )
            motion_object["recommendation"] = {
                "name": recommendation["recommendation_label"],
                "css_class": recommendation["css_class"],
            }
            if recommendation["show_recommendation_extension_field"]:
                recommendation_extension = motion["recommendation_extension"]
                await extend_reference_motion_dict(
                    all_data_provider, recommendation_extension, referenced_motions
                )
                motion_object["recommendation_extension"] = recommendation_extension

        motions.append(motion_object)

    return {
        "title": motion_block["title"],
        "motions": motions,
        "referenced_motions": referenced_motions,
    }


async def motion_poll_slide(
    all_data_provider: ProjectorAllDataProvider,
    element: Dict[str, Any],
    projector_id: int,
) -> Dict[str, Any]:
    """
    Poll slide.
    """
    poll = await get_model(all_data_provider, "motions/motion-poll", element.get("id"))
    motion = await get_model(all_data_provider, "motions/motion", poll["motion_id"])

    poll_data = {
        key: poll[key]
        for key in (
            "title",
            "type",
            "pollmethod",
            "state",
            "onehundred_percent_base",
            "majority_method",
        )
    }

    if poll["state"] == MotionPoll.STATE_PUBLISHED:
        option = await get_model(
            all_data_provider, "motions/motion-option", poll["options_id"][0]
        )  # there can only be exactly one option
        poll_data["options"] = [
            {
                "yes": float(option["yes"]),
                "no": float(option["no"]),
                "abstain": float(option["abstain"]),
            }
        ]
        poll_data["votesvalid"] = poll["votesvalid"]
        poll_data["votesinvalid"] = poll["votesinvalid"]
        poll_data["votescast"] = poll["votescast"]

    return {
        "motion": {"title": motion["title"], "identifier": motion["identifier"]},
        "poll": poll_data,
    }


def register_projector_slides() -> None:
    register_projector_slide("motions/motion", motion_slide)
    register_projector_slide("motions/motion-block", motion_block_slide)
    register_projector_slide("motions/motion-poll", motion_poll_slide)
