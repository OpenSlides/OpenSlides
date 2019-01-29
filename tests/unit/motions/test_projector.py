from typing import Any, Dict

import pytest

from openslides.motions import projector

from ...integration.helpers import all_data_config, all_data_users


@pytest.fixture
def all_data():
    return_value = all_data_config()
    return_value.update(all_data_users())
    return_value["motions/motion"] = {
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
            "state_required_permission_to_see": "",
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
        }
    }
    return_value["motions/workflow"] = {
        1: {
            "id": 1,
            "name": "Simple Workflow",
            "states": [
                {
                    "id": 1,
                    "name": "submitted",
                    "recommendation_label": None,
                    "css_class": "primary",
                    "required_permission_to_see": "",
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
                {
                    "id": 2,
                    "name": "accepted",
                    "recommendation_label": "Acceptance",
                    "css_class": "success",
                    "required_permission_to_see": "",
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
                {
                    "id": 3,
                    "name": "rejected",
                    "recommendation_label": "Rejection",
                    "css_class": "danger",
                    "required_permission_to_see": "",
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
                {
                    "id": 4,
                    "name": "not decided",
                    "recommendation_label": "No decision",
                    "css_class": "default",
                    "required_permission_to_see": "",
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
            ],
            "first_state_id": 1,
        }
    }
    return_value["motions/motion-change-recommendation"] = {}
    return return_value


def test_motion_slide(all_data):
    element: Dict[str, Any] = {"id": 1}

    data = projector.motion_slide(all_data, element)

    assert data == {
        "identifier": "4",
        "title": "12345",
        "text": "motion text",
        "amendment_paragraphs": None,
        "is_child": False,
        "show_meta_box": True,
        "reason": "",
        "state": "submitted",
        "submitter": ["Administrator"],
        "poll": {"yes": "10.000000", "no": "-1.000000", "abstain": "20.000000"},
    }
