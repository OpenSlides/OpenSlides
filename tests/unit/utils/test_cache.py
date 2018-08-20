import asyncio
import json
from typing import Any, Dict, List

import pytest

from openslides.utils.cache import ElementCache

from .cache_provider import (
    TTestCacheProvider,
    example_data,
    get_cachable_provider,
)


def decode_dict(encoded_dict: Dict[str, str]) -> Dict[str, Any]:
    """
    Helper function that loads the json values of a dict.
    """
    return {key: json.loads(value) for key, value in encoded_dict.items()}


def sort_dict(encoded_dict: Dict[str, List[Dict[str, Any]]]) -> Dict[str, List[Dict[str, Any]]]:
    """
    Helper function that sorts the value of a dict.
    """
    return {key: sorted(value, key=lambda x: x['id']) for key, value in encoded_dict.items()}


@pytest.fixture
def element_cache():
    return ElementCache(
        'test_redis',
        cache_provider_class=TTestCacheProvider,
        cachable_provider=get_cachable_provider(),
        start_time=0)


@pytest.mark.asyncio
async def test_save_full_data(element_cache):
    input_data = {
        'app/collection1': [
            {'id': 1, 'value': 'value1'},
            {'id': 2, 'value': 'value2'}],
        'app/collection2': [
            {'id': 1, 'key': 'value1'},
            {'id': 2, 'key': 'value2'}]}
    calculated_data = {
        'app/collection1:1': '{"id": 1, "value": "value1"}',
        'app/collection1:2': '{"id": 2, "value": "value2"}',
        'app/collection2:1': '{"id": 1, "key": "value1"}',
        'app/collection2:2': '{"id": 2, "key": "value2"}'}

    await element_cache.save_full_data(input_data)

    assert decode_dict(element_cache.cache_provider.full_data) == decode_dict(calculated_data)


@pytest.mark.asyncio
async def test_build_full_data(element_cache):
    result = await element_cache.build_full_data()

    assert result == example_data()
    assert decode_dict(element_cache.cache_provider.full_data) == decode_dict({
        'app/collection1:1': '{"id": 1, "value": "value1"}',
        'app/collection1:2': '{"id": 2, "value": "value2"}',
        'app/collection2:1': '{"id": 1, "key": "value1"}',
        'app/collection2:2': '{"id": 2, "key": "value2"}'})


@pytest.mark.asyncio
async def test_exists_full_data(element_cache):
    """
    Test that the return value of exists_full_data is the the same as from the
    cache_provider.
    """
    element_cache.cache_provider.full_data = 'test_value'
    assert await element_cache.exists_full_data()


@pytest.mark.asyncio
async def test_change_elements(element_cache):
    input_data = {
        'app/collection1:1': {"id": 1, "value": "updated"},
        'app/collection1:2': {"id": 2, "value": "new"},
        'app/collection2:1': {"id": 1, "key": "updated"},
        'app/collection2:2': None}

    element_cache.cache_provider.full_data = {
            'app/collection1:1': '{"id": 1, "value": "old"}',
            'app/collection2:1': '{"id": 1, "key": "old"}',
            'app/collection2:2': '{"id": 2, "key": "old"}'}

    result = await element_cache.change_elements(input_data)

    assert result == 1  # first change_id
    assert decode_dict(element_cache.cache_provider.full_data) == decode_dict({
        'app/collection1:1': '{"id": 1, "value": "updated"}',
        'app/collection1:2': '{"id": 2, "value": "new"}',
        'app/collection2:1': '{"id": 1, "key": "updated"}'})
    assert element_cache.cache_provider.change_id_data == {
        1: {
            'app/collection1:1',
            'app/collection1:2',
            'app/collection2:1',
            'app/collection2:2'}}


@pytest.mark.asyncio
async def test_change_elements_with_no_data_in_redis(element_cache):
    input_data = {
        'app/collection1:1': {"id": 1, "value": "updated"},
        'app/collection1:2': {"id": 2, "value": "new"},
        'app/collection2:1': {"id": 1, "key": "updated"},
        'app/collection2:2': None}

    result = await element_cache.change_elements(input_data)

    assert result == 1  # first change_id
    assert decode_dict(element_cache.cache_provider.full_data) == decode_dict({
        'app/collection1:1': '{"id": 1, "value": "updated"}',
        'app/collection1:2': '{"id": 2, "value": "new"}',
        'app/collection2:1': '{"id": 1, "key": "updated"}'})
    assert element_cache.cache_provider.change_id_data == {
        1: {
            'app/collection1:1',
            'app/collection1:2',
            'app/collection2:1',
            'app/collection2:2'}}


@pytest.mark.asyncio
async def test_get_all_full_data_from_db(element_cache):
    result = await element_cache.get_all_full_data()

    assert result == example_data()
    # Test that elements are written to redis
    assert decode_dict(element_cache.cache_provider.full_data) == decode_dict({
        'app/collection1:1': '{"id": 1, "value": "value1"}',
        'app/collection1:2': '{"id": 2, "value": "value2"}',
        'app/collection2:1': '{"id": 1, "key": "value1"}',
        'app/collection2:2': '{"id": 2, "key": "value2"}'})


@pytest.mark.asyncio
async def test_get_all_full_data_from_redis(element_cache):
    element_cache.cache_provider.full_data = {
        'app/collection1:1': '{"id": 1, "value": "value1"}',
        'app/collection1:2': '{"id": 2, "value": "value2"}',
        'app/collection2:1': '{"id": 1, "key": "value1"}',
        'app/collection2:2': '{"id": 2, "key": "value2"}'}

    result = await element_cache.get_all_full_data()

    # The output from redis has to be the same then the db_data
    assert sort_dict(result) == sort_dict(example_data())


@pytest.mark.asyncio
async def test_get_full_data_change_id_0(element_cache):
    element_cache.cache_provider.full_data = {
        'app/collection1:1': '{"id": 1, "value": "value1"}',
        'app/collection1:2': '{"id": 2, "value": "value2"}',
        'app/collection2:1': '{"id": 1, "key": "value1"}',
        'app/collection2:2': '{"id": 2, "key": "value2"}'}

    result = await element_cache.get_full_data(0)

    assert sort_dict(result[0]) == sort_dict(example_data())


@pytest.mark.asyncio
async def test_get_full_data_change_id_lower_then_in_redis(element_cache):
    element_cache.cache_provider.full_data = {
        'app/collection1:1': '{"id": 1, "value": "value1"}',
        'app/collection1:2': '{"id": 2, "value": "value2"}',
        'app/collection2:1': '{"id": 1, "key": "value1"}',
        'app/collection2:2': '{"id": 2, "key": "value2"}'}
    element_cache.cache_provider.change_id_data = {
        2: {'app/collection1:1'}}
    with pytest.raises(RuntimeError):
        await element_cache.get_full_data(1)


@pytest.mark.asyncio
async def test_get_full_data_change_id_data_in_redis(element_cache):
    element_cache.cache_provider.full_data = {
        'app/collection1:1': '{"id": 1, "value": "value1"}',
        'app/collection1:2': '{"id": 2, "value": "value2"}',
        'app/collection2:1': '{"id": 1, "key": "value1"}',
        'app/collection2:2': '{"id": 2, "key": "value2"}'}
    element_cache.cache_provider.change_id_data = {
        1: {'app/collection1:1', 'app/collection1:3'}}

    result = await element_cache.get_full_data(1)

    assert result == (
        {'app/collection1': [{"id": 1, "value": "value1"}]},
        ['app/collection1:3'])


@pytest.mark.asyncio
async def test_get_full_data_change_id_data_in_db(element_cache):
    element_cache.cache_provider.change_id_data = {
        1: {'app/collection1:1', 'app/collection1:3'}}

    result = await element_cache.get_full_data(1)

    assert result == (
        {'app/collection1': [{"id": 1, "value": "value1"}]},
        ['app/collection1:3'])


@pytest.mark.asyncio
async def test_get_full_data_change_id_data_in_db_empty_change_id(element_cache):
    with pytest.raises(RuntimeError):
        await element_cache.get_full_data(1)


@pytest.mark.asyncio
async def test_get_element_full_data_empty_redis(element_cache):
    result = await element_cache.get_element_full_data('app/collection1', 1)

    assert result == {'id': 1, 'value': 'value1'}


@pytest.mark.asyncio
async def test_get_element_full_data_empty_redis_does_not_exist(element_cache):
    result = await element_cache.get_element_full_data('app/collection1', 3)

    assert result is None


@pytest.mark.asyncio
async def test_get_element_full_data_full_redis(element_cache):
    element_cache.cache_provider.full_data = {
        'app/collection1:1': '{"id": 1, "value": "value1"}',
        'app/collection1:2': '{"id": 2, "value": "value2"}',
        'app/collection2:1': '{"id": 1, "key": "value1"}',
        'app/collection2:2': '{"id": 2, "key": "value2"}'}

    result = await element_cache.get_element_full_data('app/collection1', 1)

    assert result == {'id': 1, 'value': 'value1'}


@pytest.mark.asyncio
async def test_exist_restricted_data(element_cache):
    element_cache.use_restricted_data_cache = True
    element_cache.cache_provider.restricted_data = {0: {
        'app/collection1:1': '{"id": 1, "value": "value1"}',
        'app/collection1:2': '{"id": 2, "value": "value2"}',
        'app/collection2:1': '{"id": 1, "key": "value1"}',
        'app/collection2:2': '{"id": 2, "key": "value2"}'}}

    result = await element_cache.exists_restricted_data(None)

    assert result


@pytest.mark.asyncio
async def test_exist_restricted_data_do_not_use_restricted_data(element_cache):
    element_cache.use_restricted_data_cache = False
    element_cache.cache_provider.restricted_data = {0: {
        'app/collection1:1': '{"id": 1, "value": "value1"}',
        'app/collection1:2': '{"id": 2, "value": "value2"}',
        'app/collection2:1': '{"id": 1, "key": "value1"}',
        'app/collection2:2': '{"id": 2, "key": "value2"}'}}

    result = await element_cache.exists_restricted_data(None)

    assert not result


@pytest.mark.asyncio
async def test_del_user(element_cache):
    element_cache.use_restricted_data_cache = True
    element_cache.cache_provider.restricted_data = {0: {
        'app/collection1:1': '{"id": 1, "value": "value1"}',
        'app/collection1:2': '{"id": 2, "value": "value2"}',
        'app/collection2:1': '{"id": 1, "key": "value1"}',
        'app/collection2:2': '{"id": 2, "key": "value2"}'}}

    await element_cache.del_user(None)

    assert not element_cache.cache_provider.restricted_data


@pytest.mark.asyncio
async def test_del_user_for_empty_user(element_cache):
    element_cache.use_restricted_data_cache = True

    await element_cache.del_user(None)

    assert not element_cache.cache_provider.restricted_data


@pytest.mark.asyncio
async def test_update_restricted_data(element_cache):
    element_cache.use_restricted_data_cache = True

    await element_cache.update_restricted_data(None)

    assert decode_dict(element_cache.cache_provider.restricted_data[0]) == decode_dict({
        'app/collection1:1': '{"id": 1, "value": "restricted_value1"}',
        'app/collection1:2': '{"id": 2, "value": "restricted_value2"}',
        'app/collection2:1': '{"id": 1, "key": "restricted_value1"}',
        'app/collection2:2': '{"id": 2, "key": "restricted_value2"}',
        '_config:change_id': '0'})
    # Make sure the lock is deleted
    assert not await element_cache.cache_provider.get_lock_restricted_data(0)
    # And the future is done
    assert element_cache.restricted_data_cache_updater[0].done()


@pytest.mark.asyncio
async def test_update_restricted_data_disabled_restricted_data(element_cache):
    element_cache.use_restricted_data_cache = False

    await element_cache.update_restricted_data(None)

    assert not element_cache.cache_provider.restricted_data


@pytest.mark.asyncio
async def test_update_restricted_data_to_low_change_id(element_cache):
    element_cache.use_restricted_data_cache = True
    element_cache.cache_provider.restricted_data[0] = {
        '_config:change_id': '1'}
    element_cache.cache_provider.change_id_data = {
        3: {'app/collection1:1'}}

    await element_cache.update_restricted_data(None)

    assert decode_dict(element_cache.cache_provider.restricted_data[0]) == decode_dict({
        'app/collection1:1': '{"id": 1, "value": "restricted_value1"}',
        'app/collection1:2': '{"id": 2, "value": "restricted_value2"}',
        'app/collection2:1': '{"id": 1, "key": "restricted_value1"}',
        'app/collection2:2': '{"id": 2, "key": "restricted_value2"}',
        '_config:change_id': '3'})


@pytest.mark.asyncio
async def test_update_restricted_data_with_same_id(element_cache):
    element_cache.use_restricted_data_cache = True
    element_cache.cache_provider.restricted_data[0] = {
        '_config:change_id': '1'}
    element_cache.cache_provider.change_id_data = {
        1: {'app/collection1:1'}}

    await element_cache.update_restricted_data(None)

    # Same id means, there is nothing to do
    assert element_cache.cache_provider.restricted_data[0] == {
        '_config:change_id': '1'}


@pytest.mark.asyncio
async def test_update_restricted_data_with_deleted_elements(element_cache):
    element_cache.use_restricted_data_cache = True
    element_cache.cache_provider.restricted_data[0] = {
        'app/collection1:3': '{"id": 1, "value": "restricted_value1"}',
        '_config:change_id': '1'}
    element_cache.cache_provider.change_id_data = {
        2: {'app/collection1:3'}}

    await element_cache.update_restricted_data(None)

    assert element_cache.cache_provider.restricted_data[0] == {
        '_config:change_id': '2'}


@pytest.mark.asyncio
async def test_update_restricted_data_second_worker_on_different_server(element_cache):
    """
    Test, that if another worker is updating the data, noting is done.

    This tests makes use of the redis key as it would on different daphne servers.
    """
    element_cache.use_restricted_data_cache = True
    element_cache.cache_provider.restricted_data = {0: {}}
    await element_cache.cache_provider.set_lock_restricted_data(0)
    await element_cache.cache_provider.del_lock_restricted_data_after_wait(0)

    await element_cache.update_restricted_data(None)

    # Restricted_data_should not be set on second worker
    assert element_cache.cache_provider.restricted_data == {0: {}}


@pytest.mark.asyncio
async def test_update_restricted_data_second_worker_on_same_server(element_cache):
    """
    Test, that if another worker is updating the data, noting is done.

    This tests makes use of the future as it would on the same daphne server.
    """
    element_cache.use_restricted_data_cache = True
    element_cache.cache_provider.restricted_data = {0: {}}
    future = asyncio.Future()  # type: asyncio.Future
    element_cache.restricted_data_cache_updater[0] = future
    await element_cache.cache_provider.set_lock_restricted_data(0)
    await element_cache.cache_provider.del_lock_restricted_data_after_wait(0, future)

    await element_cache.update_restricted_data(None)

    # Restricted_data_should not be set on second worker
    assert element_cache.cache_provider.restricted_data == {0: {}}


@pytest.mark.asyncio
async def test_get_all_restricted_data(element_cache):
    element_cache.use_restricted_data_cache = True

    result = await element_cache.get_all_restricted_data(None)

    assert sort_dict(result) == sort_dict({
        'app/collection1': [{"id": 1, "value": "restricted_value1"}, {"id": 2, "value": "restricted_value2"}],
        'app/collection2': [{"id": 1, "key": "restricted_value1"}, {"id": 2, "key": "restricted_value2"}]})


@pytest.mark.asyncio
async def test_get_all_restricted_data_disabled_restricted_data_cache(element_cache):
    element_cache.use_restricted_data_cache = False
    result = await element_cache.get_all_restricted_data(None)

    assert sort_dict(result) == sort_dict({
        'app/collection1': [{"id": 1, "value": "restricted_value1"}, {"id": 2, "value": "restricted_value2"}],
        'app/collection2': [{"id": 1, "key": "restricted_value1"}, {"id": 2, "key": "restricted_value2"}]})


@pytest.mark.asyncio
async def test_get_restricted_data_change_id_0(element_cache):
    element_cache.use_restricted_data_cache = True

    result = await element_cache.get_restricted_data(None, 0)

    assert sort_dict(result[0]) == sort_dict({
        'app/collection1': [{"id": 1, "value": "restricted_value1"}, {"id": 2, "value": "restricted_value2"}],
        'app/collection2': [{"id": 1, "key": "restricted_value1"}, {"id": 2, "key": "restricted_value2"}]})


@pytest.mark.asyncio
async def test_get_restricted_data_disabled_restricted_data_cache(element_cache):
    element_cache.use_restricted_data_cache = False
    element_cache.cache_provider.change_id_data = {1: {'app/collection1:1', 'app/collection1:3'}}

    result = await element_cache.get_restricted_data(None, 1)

    assert result == (
        {'app/collection1': [{"id": 1, "value": "restricted_value1"}]},
        ['app/collection1:3'])


@pytest.mark.asyncio
async def test_get_restricted_data_change_id_lower_then_in_redis(element_cache):
    element_cache.use_restricted_data_cache = True
    element_cache.cache_provider.change_id_data = {2: {'app/collection1:1'}}

    with pytest.raises(RuntimeError):
        await element_cache.get_restricted_data(None, 1)


@pytest.mark.asyncio
async def test_get_restricted_data_change_with_id(element_cache):
    element_cache.use_restricted_data_cache = True
    element_cache.cache_provider.change_id_data = {2: {'app/collection1:1'}}

    result = await element_cache.get_restricted_data(None, 2)

    assert result == ({'app/collection1': [{"id": 1, "value": "restricted_value1"}]}, [])
