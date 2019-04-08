from typing import Any, Dict

import pytest

from openslides.agenda import projector


@pytest.fixture
def all_data():
    all_data = {
        "agenda/item": {
            1: {
                "id": 1,
                "item_number": "",
                "title_information": {"title": "item1"},
                "comment": None,
                "closed": False,
                "type": 1,
                "is_internal": False,
                "is_hidden": False,
                "duration": None,
                "speakers": [],
                "speaker_list_closed": False,
                "content_object": {"collection": "topics/topic", "id": 1},
                "weight": 10,
                "parent_id": None,
            },
            2: {
                "id": 2,
                "item_number": "",
                "title": "item2",
                "title_with_type": "item2",
                "title_information": {"title": "item2"},
                "comment": None,
                "closed": False,
                "type": 1,
                "is_internal": False,
                "is_hidden": False,
                "duration": None,
                "speakers": [],
                "speaker_list_closed": False,
                "content_object": {"collection": "topics/topic", "id": 1},
                "weight": 20,
                "parent_id": None,
            },
            # hidden item
            3: {
                "id": 3,
                "item_number": "",
                "title": "item3",
                "title_with_type": "item3",
                "title_information": {"title": "item3"},
                "comment": None,
                "closed": True,
                "type": 2,
                "is_internal": False,
                "is_hidden": True,
                "duration": None,
                "speakers": [],
                "speaker_list_closed": False,
                "content_object": {"collection": "topics/topic", "id": 1},
                "weight": 30,
                "parent_id": None,
            },
            # Child of item 1
            4: {
                "id": 4,
                "item_number": "",
                "title_information": {"title": "item4"},
                "comment": None,
                "closed": True,
                "type": 1,
                "is_internal": False,
                "is_hidden": False,
                "duration": None,
                "speakers": [],
                "speaker_list_closed": False,
                "content_object": {"collection": "topics/topic", "id": 1},
                "weight": 0,
                "parent_id": 1,
            },
        }
    }

    return all_data


@pytest.mark.asyncio
async def test_main_items(all_data):
    element: Dict[str, Any] = {}

    data = await projector.item_list_slide(all_data, element, 1)

    assert data == {
        "items": [
            {
                "collection": "topics/topic",
                "item_number": "",
                "title_information": {"title": "item1"},
            },
            {
                "collection": "topics/topic",
                "item_number": "",
                "title_information": {"title": "item2"},
            },
        ]
    }


@pytest.mark.asyncio
async def test_all_items(all_data):
    element: Dict[str, Any] = {"only_main_items": False}

    data = await projector.item_list_slide(all_data, element, 1)

    assert data == {
        "items": [
            {
                "collection": "topics/topic",
                "depth": 0,
                "item_number": "",
                "title_information": {"title": "item1"},
            },
            {
                "collection": "topics/topic",
                "depth": 1,
                "item_number": "",
                "title_information": {"title": "item4"},
            },
            {
                "collection": "topics/topic",
                "depth": 0,
                "item_number": "",
                "title_information": {"title": "item2"},
            },
        ]
    }
