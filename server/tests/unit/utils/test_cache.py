import json
from typing import Any, Dict, List

import pytest

from openslides.utils.cache import ElementCache

from .cache_provider import TTestCacheProvider, example_data, get_cachable_provider


def decode_dict(encoded_dict: Dict[str, str]) -> Dict[str, Any]:
    """
    Helper function that loads the json values of a dict.
    """
    return {key: json.loads(value) for key, value in encoded_dict.items()}


def sort_dict(
    encoded_dict: Dict[str, List[Dict[str, Any]]]
) -> Dict[str, List[Dict[str, Any]]]:
    """
    Helper function that sorts the value of a dict.
    """
    return {
        key: sorted(value, key=lambda x: x["id"]) for key, value in encoded_dict.items()
    }


@pytest.fixture
def element_cache():
    element_cache = ElementCache(
        cache_provider_class=TTestCacheProvider,
        cachable_provider=get_cachable_provider(),
        default_change_id=0,
    )
    element_cache.ensure_cache()
    return element_cache


@pytest.mark.asyncio
async def test_change_elements(element_cache):
    input_data = {
        "app/collection1:1": {"id": 1, "value": "updated"},
        "app/collection1:2": {"id": 2, "value": "new"},
        "app/collection2:1": {"id": 1, "key": "updated"},
        "app/collection2:2": None,  # Deleted
    }

    element_cache.cache_provider.full_data = {
        "app/collection1:1": '{"id": 1, "value": "old"}',
        "app/collection2:1": '{"id": 1, "key": "old"}',
        "app/collection2:2": '{"id": 2, "key": "old"}',
    }

    result = await element_cache.change_elements(input_data)

    assert result == 1  # first change_id
    assert decode_dict(element_cache.cache_provider.full_data) == decode_dict(
        {
            "app/collection1:1": '{"id": 1, "value": "updated"}',
            "app/collection1:2": '{"id": 2, "value": "new"}',
            "app/collection2:1": '{"id": 1, "key": "updated"}',
        }
    )
    assert element_cache.cache_provider.change_id_data == {
        1: {
            "app/collection1:1",
            "app/collection1:2",
            "app/collection2:1",
            "app/collection2:2",
        }
    }


@pytest.mark.asyncio
async def test_change_elements_with_no_data_in_redis(element_cache):
    input_data = {
        "app/collection1:1": {"id": 1, "value": "updated"},
        "app/collection1:2": {"id": 2, "value": "new"},
        "app/collection2:1": {"id": 1, "key": "updated"},
        "app/collection2:2": None,
        "app/personalized-collection:2": None,
    }

    result = await element_cache.change_elements(input_data)

    assert result == 1  # first change_id
    assert decode_dict(element_cache.cache_provider.full_data) == decode_dict(
        {
            "app/collection1:1": '{"id": 1, "value": "updated"}',
            "app/collection1:2": '{"id": 2, "value": "new"}',
            "app/collection2:1": '{"id": 1, "key": "updated"}',
            "app/personalized-collection:1": '{"id": 1, "key": "value1", "user_id": 1}',
        }
    )
    assert element_cache.cache_provider.change_id_data == {
        1: {
            "app/collection1:1",
            "app/collection1:2",
            "app/collection2:1",
            "app/collection2:2",
            "app/personalized-collection:2",
        }
    }


@pytest.mark.asyncio
async def test_get_all_data_from_db(element_cache):
    result = await element_cache.get_all_data_list()

    assert result == example_data()
    # Test that elements are written to redis
    assert decode_dict(element_cache.cache_provider.full_data) == decode_dict(
        {
            "app/collection1:1": '{"id": 1, "value": "value1"}',
            "app/collection1:2": '{"id": 2, "value": "value2"}',
            "app/collection2:1": '{"id": 1, "key": "value1"}',
            "app/collection2:2": '{"id": 2, "key": "value2"}',
            "app/personalized-collection:1": '{"id": 1, "key": "value1", "user_id": 1}',
            "app/personalized-collection:2": '{"id": 2, "key": "value2", "user_id": 2}',
        }
    )


@pytest.mark.asyncio
async def test_get_all_data_from_redis(element_cache):
    element_cache.cache_provider.full_data = {
        "app/collection1:1": '{"id": 1, "value": "value1"}',
        "app/collection1:2": '{"id": 2, "value": "value2"}',
        "app/collection2:1": '{"id": 1, "key": "value1"}',
        "app/collection2:2": '{"id": 2, "key": "value2"}',
        "app/personalized-collection:1": '{"id": 1, "key": "value1", "user_id": 1}',
        "app/personalized-collection:2": '{"id": 2, "key": "value2", "user_id": 2}',
    }

    result = await element_cache.get_all_data_list()

    # The output from redis has to be the same then the db_data
    assert sort_dict(result) == sort_dict(example_data())


@pytest.mark.asyncio
async def test_get_element_data_empty_redis(element_cache):
    result = await element_cache.get_element_data("app/collection1", 1)

    assert result == {"id": 1, "value": "value1"}


@pytest.mark.asyncio
async def test_get_element_data_empty_redis_does_not_exist(element_cache):
    result = await element_cache.get_element_data("app/collection1", 3)

    assert result is None


@pytest.mark.asyncio
async def test_get_element_data_full_redis(element_cache):
    element_cache.cache_provider.full_data = {
        "app/collection1:1": '{"id": 1, "value": "value1"}',
        "app/collection1:2": '{"id": 2, "value": "value2"}',
        "app/collection2:1": '{"id": 1, "key": "value1"}',
        "app/collection2:2": '{"id": 2, "key": "value2"}',
    }

    result = await element_cache.get_element_data("app/collection1", 1)

    assert result == {"id": 1, "value": "value1"}


@pytest.mark.asyncio
async def test_lowest_change_id_after_updating_lowest_element(element_cache):
    await element_cache.change_elements(
        {"app/collection1:1": {"id": 1, "value": "updated1"}}
    )
    first_lowest_change_id = await element_cache.get_lowest_change_id()
    # Alter same element again
    await element_cache.change_elements(
        {"app/collection1:1": {"id": 1, "value": "updated2"}}
    )
    second_lowest_change_id = await element_cache.get_lowest_change_id()

    assert first_lowest_change_id == 0
    assert second_lowest_change_id == 0  # The lowest_change_id should not change
