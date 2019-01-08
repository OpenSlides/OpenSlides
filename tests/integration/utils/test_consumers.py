import asyncio
from importlib import import_module
from unittest.mock import patch

import pytest
from asgiref.sync import sync_to_async
from channels.testing import WebsocketCommunicator
from django.conf import settings
from django.contrib.auth import BACKEND_SESSION_KEY, HASH_SESSION_KEY, SESSION_KEY

from openslides.asgi import application
from openslides.core.config import config
from openslides.utils.autoupdate import (
    Element,
    inform_changed_elements,
    inform_deleted_data,
)
from openslides.utils.cache import element_cache

from ...unit.utils.cache_provider import Collection1, Collection2, get_cachable_provider
from ..helpers import TConfig, TUser


@pytest.fixture(autouse=True)
async def prepare_element_cache(settings):
    """
    Resets the element cache.

    Uses a cacheable_provider for tests with example data.
    """
    await element_cache.cache_provider.clear_cache()
    orig_cachable_provider = element_cache.cachable_provider
    element_cache.cachable_provider = get_cachable_provider(
        [Collection1(), Collection2(), TConfig(), TUser()]
    )
    element_cache._cachables = None
    await sync_to_async(element_cache.ensure_cache)()
    yield
    # Reset the cachable_provider
    element_cache.cachable_provider = orig_cachable_provider
    element_cache._cachables = None
    await element_cache.cache_provider.clear_cache()


@pytest.fixture
async def get_communicator():
    communicator: WebsocketCommunicator = None

    def get_communicator(query_string=""):
        nonlocal communicator  # use the outer communicator variable
        if query_string:
            query_string = "?{}".format(query_string)
        communicator = WebsocketCommunicator(application, "/ws/{}".format(query_string))
        return communicator

    yield get_communicator
    if communicator:
        await communicator.disconnect()


@pytest.fixture
async def communicator(get_communicator):
    yield get_communicator()


@pytest.fixture
async def set_config():
    """
    Set a config variable in the element_cache without hitting the database.
    """

    async def _set_config(key, value):
        with patch("openslides.utils.autoupdate.save_history"):
            collection_string = config.get_collection_string()
            config_id = config.key_to_id[key]  # type: ignore
            full_data = {"id": config_id, "key": key, "value": value}
            await sync_to_async(inform_changed_elements)(
                [
                    Element(
                        id=config_id,
                        collection_string=collection_string,
                        full_data=full_data,
                        information="",
                        user_id=None,
                        disable_history=True,
                    )
                ]
            )

    return _set_config


@pytest.mark.asyncio
async def test_normal_connection(get_communicator, set_config):
    await set_config("general_system_enable_anonymous", True)
    connected, __ = await get_communicator().connect()
    assert connected


@pytest.mark.asyncio
async def test_connection_with_change_id(get_communicator, set_config):
    await set_config("general_system_enable_anonymous", True)
    communicator = get_communicator("change_id=0")
    await communicator.connect()

    response = await communicator.receive_json_from()

    type = response.get("type")
    content = response.get("content")
    assert type == "autoupdate"
    assert "changed" in content
    assert "deleted" in content
    assert "from_change_id" in content
    assert "to_change_id" in content
    assert Collection1().get_collection_string() in content["changed"]
    assert Collection2().get_collection_string() in content["changed"]
    assert TConfig().get_collection_string() in content["changed"]
    assert TUser().get_collection_string() in content["changed"]


@pytest.mark.asyncio
async def test_connection_with_change_id_get_restricted_data_with_restricted_data_cache(
    get_communicator, set_config
):
    """
    Test, that the returned data is the restricted_data when restricted_data_cache is activated
    """
    try:
        # Save the value of use_restricted_data_cache
        original_use_restricted_data = element_cache.use_restricted_data_cache
        element_cache.use_restricted_data_cache = True

        await set_config("general_system_enable_anonymous", True)
        communicator = get_communicator("change_id=0")
        await communicator.connect()

        response = await communicator.receive_json_from()

        content = response.get("content")
        assert content["changed"]["app/collection1"][0]["value"] == "restricted_value1"
    finally:
        # reset the value of use_restricted_data_cache
        element_cache.use_restricted_data_cache = original_use_restricted_data


@pytest.mark.asyncio
async def test_connection_with_invalid_change_id(get_communicator, set_config):
    await set_config("general_system_enable_anonymous", True)
    communicator = get_communicator("change_id=invalid")
    connected, __ = await communicator.connect()

    assert connected is False


@pytest.mark.asyncio
async def test_connection_with_to_big_change_id(get_communicator, set_config):
    await set_config("general_system_enable_anonymous", True)
    communicator = get_communicator("change_id=100")

    connected, __ = await communicator.connect()

    assert connected is True
    assert await communicator.receive_nothing()


@pytest.mark.asyncio
async def test_changed_data_autoupdate_off(communicator, set_config):
    await set_config("general_system_enable_anonymous", True)
    await communicator.connect()

    # Change a config value
    await set_config("general_event_name", "Test Event")
    assert await communicator.receive_nothing()


@pytest.mark.asyncio
async def test_changed_data_autoupdate_on(get_communicator, set_config):
    await set_config("general_system_enable_anonymous", True)
    communicator = get_communicator("autoupdate=on")
    await communicator.connect()

    # Change a config value
    await set_config("general_event_name", "Test Event")
    response = await communicator.receive_json_from()

    id = config.get_key_to_id()["general_event_name"]
    type = response.get("type")
    content = response.get("content")
    assert type == "autoupdate"
    assert content["changed"] == {
        "core/config": [{"id": id, "key": "general_event_name", "value": "Test Event"}]
    }


@pytest.mark.asyncio
async def test_anonymous_disabled(communicator):
    connected, __ = await communicator.connect()

    assert not connected


@pytest.mark.asyncio
async def test_with_user():
    # login user with id 1
    engine = import_module(settings.SESSION_ENGINE)
    session = engine.SessionStore()  # type: ignore
    session[SESSION_KEY] = "1"
    session[
        HASH_SESSION_KEY
    ] = "362d4f2de1463293cb3aaba7727c967c35de43ee"  # see helpers.TUser
    session[BACKEND_SESSION_KEY] = "django.contrib.auth.backends.ModelBackend"
    session.save()
    scn = settings.SESSION_COOKIE_NAME
    cookies = (b"cookie", "{}={}".format(scn, session.session_key).encode())
    communicator = WebsocketCommunicator(application, "/ws/", headers=[cookies])

    connected, __ = await communicator.connect()

    assert connected

    await communicator.disconnect()


@pytest.mark.asyncio
async def test_receive_deleted_data(get_communicator, set_config):
    await set_config("general_system_enable_anonymous", True)
    communicator = get_communicator("autoupdate=on")
    await communicator.connect()

    # Delete test element
    with patch("openslides.utils.autoupdate.save_history"):
        await sync_to_async(inform_deleted_data)(
            [(Collection1().get_collection_string(), 1)]
        )
    response = await communicator.receive_json_from()

    type = response.get("type")
    content = response.get("content")
    assert type == "autoupdate"
    assert content["deleted"] == {Collection1().get_collection_string(): [1]}


@pytest.mark.asyncio
async def test_send_notify(communicator, set_config):
    await set_config("general_system_enable_anonymous", True)
    await communicator.connect()

    await communicator.send_json_to(
        {
            "type": "notify",
            "content": [{"testmessage": "foobar, what else."}],
            "id": "test",
        }
    )
    response = await communicator.receive_json_from()

    content = response["content"]
    assert isinstance(content, list)
    assert len(content) == 1
    assert content[0]["testmessage"] == "foobar, what else."
    assert "senderReplyChannelName" in content[0]
    assert content[0]["senderUserId"] == 0


@pytest.mark.asyncio
async def test_invalid_websocket_message_type(communicator, set_config):
    await set_config("general_system_enable_anonymous", True)
    await communicator.connect()

    await communicator.send_json_to([])

    response = await communicator.receive_json_from()
    assert response["type"] == "error"


@pytest.mark.asyncio
async def test_invalid_websocket_message_no_id(communicator, set_config):
    await set_config("general_system_enable_anonymous", True)
    await communicator.connect()

    await communicator.send_json_to({"type": "test", "content": "foobar"})

    response = await communicator.receive_json_from()
    assert response["type"] == "error"


@pytest.mark.asyncio
async def test_send_unknown_type(communicator, set_config):
    await set_config("general_system_enable_anonymous", True)
    await communicator.connect()

    await communicator.send_json_to(
        {
            "type": "if_you_add_this_type_to_openslides_I_will_be_sad",
            "content": True,
            "id": "test_id",
        }
    )

    response = await communicator.receive_json_from()
    assert response["type"] == "error"
    assert response["in_response"] == "test_id"


@pytest.mark.asyncio
async def test_request_constants(communicator, settings, set_config):
    await set_config("general_system_enable_anonymous", True)
    await communicator.connect()

    await communicator.send_json_to(
        {"type": "constants", "content": "", "id": "test_id"}
    )

    response = await communicator.receive_json_from()
    assert response["type"] == "constants"
    # See conftest.py for the content of 'content'
    assert response["content"] == {"constant1": "value1", "constant2": "value2"}


@pytest.mark.asyncio
async def test_send_get_elements(communicator, set_config):
    await set_config("general_system_enable_anonymous", True)
    await communicator.connect()

    await communicator.send_json_to(
        {"type": "getElements", "content": {}, "id": "test_id"}
    )
    response = await communicator.receive_json_from()

    type = response.get("type")
    content = response.get("content")
    assert type == "autoupdate"
    assert "changed" in content
    assert "deleted" in content
    assert "from_change_id" in content
    assert "to_change_id" in content
    assert Collection1().get_collection_string() in content["changed"]
    assert Collection2().get_collection_string() in content["changed"]
    assert TConfig().get_collection_string() in content["changed"]
    assert TUser().get_collection_string() in content["changed"]


@pytest.mark.asyncio
async def test_send_get_elements_to_big_change_id(communicator, set_config):
    await set_config("general_system_enable_anonymous", True)
    await communicator.connect()

    await communicator.send_json_to(
        {"type": "getElements", "content": {"change_id": 100}, "id": "test_id"}
    )
    response = await communicator.receive_json_from()

    type = response.get("type")
    assert type == "error"
    assert response.get("in_response") == "test_id"


@pytest.mark.asyncio
async def test_send_get_elements_to_small_change_id(communicator, set_config):
    await set_config("general_system_enable_anonymous", True)
    await communicator.connect()

    await communicator.send_json_to(
        {"type": "getElements", "content": {"change_id": 1}, "id": "test_id"}
    )
    response = await communicator.receive_json_from()

    type = response.get("type")
    assert type == "autoupdate"
    assert response.get("in_response") == "test_id"
    assert response.get("content")["all_data"]


@pytest.mark.asyncio
async def test_send_connect_twice_with_clear_change_id_cache(communicator, set_config):
    """
    Test, that a second request with change_id+1 from the first request, returns
    an error.
    """
    await set_config("general_system_enable_anonymous", True)
    element_cache.cache_provider.change_id_data = {}  # type: ignore
    await communicator.connect()
    await communicator.send_json_to(
        {"type": "getElements", "content": {"change_id": 0}, "id": "test_id"}
    )
    response1 = await communicator.receive_json_from()
    first_change_id = response1.get("content")["to_change_id"]

    await communicator.send_json_to(
        {
            "type": "getElements",
            "content": {"change_id": first_change_id + 1},
            "id": "test_id",
        }
    )
    response2 = await communicator.receive_json_from()

    assert response2["type"] == "error"
    assert (
        response2.get("content")
        == "Requested change_id is higher this highest change_id."
    )


@pytest.mark.asyncio
async def test_send_connect_twice_with_clear_change_id_cache_same_change_id_then_first_request(
    communicator, set_config
):
    """
    Test, that a second request with the change_id from the first request, returns
    all data.

    A client should not do this but request for change_id+1
    """
    await set_config("general_system_enable_anonymous", True)
    await element_cache.cache_provider.clear_cache()
    await communicator.connect()
    await communicator.send_json_to(
        {"type": "getElements", "content": {"change_id": 0}, "id": "test_id"}
    )
    response1 = await communicator.receive_json_from()
    first_change_id = response1.get("content")["to_change_id"]

    await communicator.send_json_to(
        {
            "type": "getElements",
            "content": {"change_id": first_change_id},
            "id": "test_id",
        }
    )
    response2 = await communicator.receive_json_from()

    assert response2["type"] == "autoupdate"
    assert response2.get("content")["all_data"]


@pytest.mark.asyncio
async def test_request_changed_elements_no_douple_elements(communicator, set_config):
    """
    Test, that when an elements is changed twice, it is only returned
    onces when ask a range of change ids.

    Test when all_data is false
    """
    await set_config("general_system_enable_anonymous", True)
    await communicator.connect()
    # Change element twice
    await set_config("general_event_name", "Test Event")
    await set_config("general_event_name", "Other value")
    # Ask for all elements
    await communicator.send_json_to(
        {"type": "getElements", "content": {"change_id": 2}, "id": "test_id"}
    )

    response = await communicator.receive_json_from()
    type = response.get("type")
    content = response.get("content")
    assert type == "autoupdate"
    assert not response.get("content")["all_data"]
    config_ids = [e["id"] for e in content["changed"]["core/config"]]
    # test that config_ids are unique
    assert len(config_ids) == len(set(config_ids))


@pytest.mark.asyncio
async def test_send_invalid_get_elements(communicator, set_config):
    await set_config("general_system_enable_anonymous", True)
    await communicator.connect()

    await communicator.send_json_to(
        {"type": "getElements", "content": {"change_id": "some value"}, "id": "test_id"}
    )
    response = await communicator.receive_json_from()

    type = response.get("type")
    assert type == "error"
    assert response.get("in_response") == "test_id"


@pytest.mark.asyncio
async def test_turn_on_autoupdate(communicator, set_config):
    await set_config("general_system_enable_anonymous", True)
    await communicator.connect()

    await communicator.send_json_to(
        {"type": "autoupdate", "content": "on", "id": "test_id"}
    )
    await asyncio.sleep(0.01)
    # Change a config value
    await set_config("general_event_name", "Test Event")
    response = await communicator.receive_json_from()

    id = config.get_key_to_id()["general_event_name"]
    type = response.get("type")
    content = response.get("content")
    assert type == "autoupdate"
    assert content["changed"] == {
        "core/config": [{"id": id, "key": "general_event_name", "value": "Test Event"}]
    }


@pytest.mark.asyncio
async def test_turn_off_autoupdate(get_communicator, set_config):
    await set_config("general_system_enable_anonymous", True)
    communicator = get_communicator("autoupdate=on")
    await communicator.connect()

    await communicator.send_json_to(
        {"type": "autoupdate", "content": False, "id": "test_id"}
    )
    await asyncio.sleep(0.01)
    # Change a config value
    await set_config("general_event_name", "Test Event")
    assert await communicator.receive_nothing()
