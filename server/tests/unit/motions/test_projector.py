from typing import Any, Dict

import pytest

from openslides.motions import projector

from ...integration.helpers import get_all_data_provider


@pytest.fixture
def all_data_provider():
    data = {}
    data["motions/motion"] = {
        1: {
            "id": 1,
            "identifier": "4",
            "title": "12345",
            "text": "motion text",
            "amendment_paragraphs": None,
            "modified_final_version": "",
            "reason": "",
            "parent_id": None,
            "category_id": None,
            "comments": [],
            "motion_block_id": None,
            "origin": "",
            "submitters": [{"id": 4, "user_id": 1, "motion_id": 1, "weight": 1}],
            "supporters_id": [],
            "state_id": 1,
            "state_extension": None,
            "state_restriction": [],
            "statute_paragraph_id": None,
            "workflow_id": 1,
            "recommendation_id": None,
            "recommendation_extension": None,
            "tags_id": [],
            "attachments_id": [],
            "polls": [
                {
                    "id": 1,
                    "motion_id": 4,
                    "yes": "10.000000",
                    "no": "-1.000000",
                    "abstain": "20.000000",
                    "votesvalid": "11.000000",
                    "votesinvalid": "2.000000",
                    "votescast": "30.000000",
                    "has_votes": True,
                }
            ],
            "agenda_item_id": 4,
            "log_messages": [
                {
                    "message_list": "['Vote updated']",
                    "person_id": 1,
                    "time": "2019-01-19T22:15:53.291123+01:00",
                    "message": "Jan. 19, 2019, 10:15 p.m. Vote updated by Administrator",
                },
                {
                    "message_list": "['Vote created']",
                    "person_id": 1,
                    "time": "2019-01-19T22:15:37.446262+01:00",
                    "message": "Jan. 19, 2019, 10:15 p.m. Vote created by Administrator",
                },
                {
                    "message_list": "['Motion created']",
                    "person_id": 1,
                    "time": "2019-01-19T18:37:34.833749+01:00",
                    "message": "Jan. 19, 2019, 6:37 p.m. Motion created by Administrator",
                },
            ],
            "sort_parent_id": None,
            "weight": 10000,
            "created": "2019-01-19T18:37:34.741336+01:00",
            "last_modified": "2019-01-19T18:37:34.741368+01:00",
            "change_recommendations_id": [1, 2],
            "amendments_id": [2],
        },
        2: {
            "id": 2,
            "identifier": "Ä1",
            "title": "Amendment for 12345",
            "text": "",
            "amendment_paragraphs": ["New motion text"],
            "modified_final_version": "",
            "reason": "",
            "parent_id": 1,
            "category_id": None,
            "comments": [],
            "motion_block_id": None,
            "origin": "",
            "submitters": [{"id": 4, "user_id": 1, "motion_id": 1, "weight": 1}],
            "supporters_id": [],
            "state_id": 1,
            "state_extension": None,
            "state_restriction": [],
            "statute_paragraph_id": None,
            "workflow_id": 1,
            "recommendation_id": None,
            "recommendation_extension": None,
            "tags_id": [],
            "attachments_id": [],
            "polls": [],
            "agenda_item_id": 4,
            "log_messages": [],
            "sort_parent_id": None,
            "weight": 10000,
            "created": "2019-01-19T18:37:34.741336+01:00",
            "last_modified": "2019-01-19T18:37:34.741368+01:00",
            "change_recommendations": [],
            "change_recommendations_id": [],
            "amendments_id": [],
        },
        3: {
            "id": 3,
            "identifier": None,
            "title": "Statute amendment for §1 Preamble",
            "text": "<p>Some other preamble text</p>",
            "amendment_paragraphs": None,
            "modified_final_version": "",
            "reason": "",
            "parent_id": None,
            "category_id": None,
            "comments": [],
            "motion_block_id": None,
            "origin": "",
            "submitters": [{"id": 4, "user_id": 1, "motion_id": 1, "weight": 1}],
            "supporters_id": [],
            "state_id": 1,
            "state_extension": None,
            "state_restriction": [],
            "statute_paragraph_id": 1,
            "workflow_id": 1,
            "recommendation_id": None,
            "recommendation_extension": None,
            "tags_id": [],
            "attachments_id": [],
            "polls": [],
            "agenda_item_id": 4,
            "log_messages": [],
            "sort_parent_id": None,
            "weight": 10000,
            "created": "2019-01-19T18:37:34.741336+01:00",
            "last_modified": "2019-01-19T18:37:34.741368+01:00",
            "change_recommendations": [],
            "change_recommendations_id": [],
            "amendments_id": [],
        },
    }
    data["motions/workflow"] = {
        1: {
            "id": 1,
            "name": "Simple Workflow",
            "states": [1, 2, 3, 4],
            "first_state_id": 1,
        }
    }
    data["motions/state"] = {
        1: {
            "id": 1,
            "name": "submitted",
            "recommendation_label": None,
            "css_class": "lightblue",
            "restriction": [],
            "allow_support": True,
            "allow_create_poll": True,
            "allow_submitter_edit": True,
            "dont_set_identifier": False,
            "show_state_extension_field": False,
            "merge_amendment_into_final": 0,
            "show_recommendation_extension_field": False,
            "next_states_id": [2, 3, 4],
            "workflow_id": 1,
        },
        2: {
            "id": 2,
            "name": "accepted",
            "recommendation_label": "Acceptance",
            "css_class": "green",
            "restriction": [],
            "allow_support": False,
            "allow_create_poll": False,
            "allow_submitter_edit": False,
            "dont_set_identifier": False,
            "show_state_extension_field": False,
            "merge_amendment_into_final": 1,
            "show_recommendation_extension_field": False,
            "next_states_id": [],
            "workflow_id": 1,
        },
        3: {
            "id": 3,
            "name": "rejected",
            "recommendation_label": "Rejection",
            "css_class": "red",
            "restriction": [],
            "allow_support": False,
            "allow_create_poll": False,
            "allow_submitter_edit": False,
            "dont_set_identifier": False,
            "show_state_extension_field": False,
            "merge_amendment_into_final": -1,
            "show_recommendation_extension_field": False,
            "next_states_id": [],
            "workflow_id": 1,
        },
        4: {
            "id": 4,
            "name": "not decided",
            "recommendation_label": "No decision",
            "css_class": "grey",
            "restriction": [],
            "allow_support": False,
            "allow_create_poll": False,
            "allow_submitter_edit": False,
            "dont_set_identifier": False,
            "show_state_extension_field": False,
            "merge_amendment_into_final": -1,
            "show_recommendation_extension_field": False,
            "next_states_id": [],
            "workflow_id": 1,
        },
    }
    data["motions/statute-paragraph"] = {
        1: {
            "id": 1,
            "title": "§1 Preamble",
            "text": "<p>Some preamble text</p>",
            "weight": 10000,
        }
    }
    data["motions/motion-change-recommendation"] = {
        1: {
            "id": 1,
            "motion_id": 1,
            "rejected": False,
            "internal": True,
            "type": 0,
            "other_description": "",
            "line_from": 1,
            "line_to": 2,
            "text": "internal new motion text",
            "creation_time": "2019-02-09T09:54:06.256378+01:00",
        },
        2: {
            "id": 2,
            "motion_id": 1,
            "rejected": False,
            "internal": False,
            "type": 0,
            "other_description": "",
            "line_from": 1,
            "line_to": 2,
            "text": "public new motion text",
            "creation_time": "2019-02-09T09:54:06.256378+01:00",
        },
    }
    return get_all_data_provider(data)


@pytest.mark.asyncio
async def test_motion_slide(all_data_provider):
    element: Dict[str, Any] = {"id": 1}

    data = await projector.motion_slide(all_data_provider, element, 1)

    assert data == {
        "identifier": "4",
        "title": "12345",
        "text": "motion text",
        "amendments": [
            {
                "id": 2,
                "title": "Amendment for 12345",
                "amendment_paragraphs": ["New motion text"],
                "identifier": "Ä1",
                "merge_amendment_into_final": 0,
                "merge_amendment_into_diff": 0,
            }
        ],
        "amendment_paragraphs": None,
        "change_recommendations": [
            {
                "id": 2,
                "motion_id": 1,
                "rejected": False,
                "internal": False,
                "type": 0,
                "other_description": "",
                "line_from": 1,
                "line_to": 2,
                "text": "public new motion text",
                "creation_time": "2019-02-09T09:54:06.256378+01:00",
            }
        ],
        "base_motion": None,
        "base_statute": None,
        "is_child": False,
        "show_meta_box": False,
        "show_referring_motions": True,
        "reason": "",
        "submitters": ["Administrator"],
        "line_length": 85,
        "line_numbering_mode": "outside",
        "preamble": "The assembly may decide:",
        "recommendation_referencing_motions": None,
    }


@pytest.mark.asyncio
async def test_amendment_slide(all_data_provider):
    element: Dict[str, Any] = {"id": 2}

    data = await projector.motion_slide(all_data_provider, element, 1)

    assert data == {
        "identifier": "Ä1",
        "title": "Amendment for 12345",
        "text": "",
        "amendments": [],
        "amendment_paragraphs": ["New motion text"],
        "change_recommendations": [],
        "base_motion": {"identifier": "4", "text": "motion text", "title": "12345"},
        "base_statute": None,
        "is_child": True,
        "show_meta_box": False,
        "show_referring_motions": True,
        "reason": "",
        "submitters": ["Administrator"],
        "line_length": 85,
        "line_numbering_mode": "outside",
        "preamble": "The assembly may decide:",
        "recommendation_referencing_motions": None,
    }


@pytest.mark.asyncio
async def test_statute_amendment_slide(all_data_provider):
    element: Dict[str, Any] = {"id": 3}

    data = await projector.motion_slide(all_data_provider, element, 1)

    assert data == {
        "identifier": None,
        "title": "Statute amendment for §1 Preamble",
        "text": "<p>Some other preamble text</p>",
        "amendments": [],
        "amendment_paragraphs": None,
        "change_recommendations": [],
        "base_motion": None,
        "base_statute": {"title": "§1 Preamble", "text": "<p>Some preamble text</p>"},
        "is_child": False,
        "show_meta_box": False,
        "show_referring_motions": True,
        "reason": "",
        "submitters": ["Administrator"],
        "line_length": 85,
        "line_numbering_mode": "outside",
        "preamble": "The assembly may decide:",
        "recommendation_referencing_motions": None,
    }
