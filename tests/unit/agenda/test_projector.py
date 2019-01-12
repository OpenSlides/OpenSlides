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
                "title": "Item1",
                "title_with_type": "Item1",
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
                "title": "item4",
                "title_with_type": "item4",
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


def test_items(all_data):
    config: Dict[str, Any] = {}

    data = projector.items(config, all_data)

    assert data == {"items": ["Item1", "item2"]}


def test_items_parent(all_data):
    config: Dict[str, Any] = {"id": 1}

    data = projector.items(config, all_data)

    assert data == {"items": ["item4"]}


def test_items_tree(all_data):
    config: Dict[str, Any] = {"tree": True}

    data = projector.items(config, all_data)

    assert data == {"items": [("Item1", [("item4", [])]), ("item2", [])]}


def test_items_tree_parent(all_data):
    config: Dict[str, Any] = {"tree": True, "id": 1}

    data = projector.items(config, all_data)

    assert data == {"items": [("item4", [])]}
