from importlib import import_module

import pytest
from asgiref.sync import sync_to_async
from channels.testing import WebsocketCommunicator
from django.conf import settings
from django.contrib.auth import (
    BACKEND_SESSION_KEY,
    HASH_SESSION_KEY,
    SESSION_KEY,
)

from openslides.asgi import application
from openslides.core.config import config
from openslides.utils.autoupdate import inform_deleted_data
from openslides.utils.cache import element_cache

from ...unit.utils.cache_provider import (
    Collection1,
    Collection2,
    get_cachable_provider,
)
from ..helpers import TConfig, TUser, set_config


@pytest.fixture(autouse=True)
def prepare_element_cache(settings):
    """
    Resets the element cache.

    Uses a cacheable_provider for tests with example data.
    """
    settings.SKIP_CACHE = False
    element_cache.cache_provider.clear_cache()
    orig_cachable_provider = element_cache.cachable_provider
    element_cache.cachable_provider = get_cachable_provider([Collection1(), Collection2(), TConfig(), TUser()])
    element_cache._cachables = None
    yield
    # Reset the cachable_provider
    element_cache.cachable_provider = orig_cachable_provider
    element_cache._cachables = None
    element_cache.cache_provider.clear_cache()


@pytest.fixture
def communicator(request, event_loop):
    communicator = WebsocketCommunicator(application, "/ws/site/")

    # This style is needed for python 3.5. Use the generaor style when 3.5 ist dropped
    def fin():
        async def afin():
            await communicator.disconnect()
        event_loop.run_until_complete(afin())

    request.addfinalizer(fin)
    return communicator


@pytest.mark.asyncio
async def test_normal_connection(communicator):
    await set_config('general_system_enable_anonymous', True)
    await communicator.connect()

    response = await communicator.receive_json_from()

    type = response.get('type')
    content = response.get('content')
    assert type == 'autoupdate'
    # Test, that both example objects are returned
    assert len(content) > 10


@pytest.mark.asyncio
async def test_receive_changed_data(communicator):
    await set_config('general_system_enable_anonymous', True)
    await communicator.connect()
    await communicator.receive_json_from()

    # Change a config value after the startup data has been received
    await set_config('general_event_name', 'Test Event')
    response = await communicator.receive_json_from()

    id = config.get_key_to_id()['general_event_name']
    type = response.get('type')
    content = response.get('content')
    assert type == 'autoupdate'
    assert content == [
        {'action': 'changed',
         'collection': 'core/config',
         'data': {'id': id, 'key': 'general_event_name', 'value': 'Test Event'},
         'id': id}]


@pytest.mark.asyncio
async def test_anonymous_disabled(communicator):
    connected, __ = await communicator.connect()

    assert not connected


@pytest.mark.asyncio
async def test_with_user():
    # login user with id 1
    engine = import_module(settings.SESSION_ENGINE)
    session = engine.SessionStore()  # type: ignore
    session[SESSION_KEY] = '1'
    session[HASH_SESSION_KEY] = '362d4f2de1463293cb3aaba7727c967c35de43ee'  # see helpers.TUser
    session[BACKEND_SESSION_KEY] = 'django.contrib.auth.backends.ModelBackend'
    session.save()
    scn = settings.SESSION_COOKIE_NAME
    cookies = (b'cookie', '{}={}'.format(scn, session.session_key).encode())
    communicator = WebsocketCommunicator(application, "/ws/site/", headers=[cookies])

    connected, __ = await communicator.connect()

    assert connected

    await communicator.disconnect()


@pytest.mark.asyncio
async def test_receive_deleted_data(communicator):
    await set_config('general_system_enable_anonymous', True)
    await communicator.connect()
    await communicator.receive_json_from()

    # Delete test element
    await sync_to_async(inform_deleted_data)([(Collection1().get_collection_string(), 1)])
    response = await communicator.receive_json_from()

    type = response.get('type')
    content = response.get('content')
    assert type == 'autoupdate'
    assert content == [{'action': 'deleted', 'collection': Collection1().get_collection_string(), 'id': 1}]


@pytest.mark.asyncio
async def test_send_invalid_notify_not_a_list(communicator):
    await set_config('general_system_enable_anonymous', True)
    await communicator.connect()
    # Await the startup data
    await communicator.receive_json_from()

    await communicator.send_json_to({'type': 'notify', 'content': {'testmessage': 'foobar, what else.'}, 'id': 'test_send_invalid_notify_not_a_list'})
    response = await communicator.receive_json_from()

    assert response['type'] == 'error'
    assert response['content'] == 'Invalid notify message'
    assert response['in_response'] == 'test_send_invalid_notify_not_a_list'


@pytest.mark.asyncio
async def test_send_invalid_notify_no_elements(communicator):
    await set_config('general_system_enable_anonymous', True)
    await communicator.connect()
    # Await the startup data
    await communicator.receive_json_from()

    await communicator.send_json_to({'type': 'notify', 'content': [], 'id': 'test_send_invalid_notify_no_elements'})
    response = await communicator.receive_json_from()

    assert response['type'] == 'error'
    assert response['content'] == 'Invalid notify message'
    assert response['in_response'] == 'test_send_invalid_notify_no_elements'


@pytest.mark.asyncio
async def test_send_invalid_notify_str_in_list(communicator):
    await set_config('general_system_enable_anonymous', True)
    await communicator.connect()
    # Await the startup data
    await communicator.receive_json_from()

    await communicator.send_json_to({'type': 'notify', 'content': [{}, 'testmessage'], 'id': 'test_send_invalid_notify_str_in_list'})
    response = await communicator.receive_json_from()

    assert response['type'] == 'error'
    assert response['content'] == 'Invalid notify message'
    assert response['in_response'] == 'test_send_invalid_notify_str_in_list'


@pytest.mark.asyncio
async def test_send_valid_notify(communicator):
    await set_config('general_system_enable_anonymous', True)
    await communicator.connect()
    # Await the startup data
    await communicator.receive_json_from()

    await communicator.send_json_to({'type': 'notify', 'content': [{'testmessage': 'foobar, what else.'}], 'id': 'test'})
    response = await communicator.receive_json_from()

    content = response['content']
    assert isinstance(content, list)
    assert len(content) == 1
    assert content[0]['testmessage'] == 'foobar, what else.'
    assert 'senderReplyChannelName' in content[0]
    assert content[0]['senderUserId'] == 0


@pytest.mark.asyncio
async def test_invalid_websocket_message_type(communicator):
    await set_config('general_system_enable_anonymous', True)
    await communicator.connect()
    # Await the startup data
    await communicator.receive_json_from()

    await communicator.send_json_to([])

    response = await communicator.receive_json_from()
    assert response['type'] == 'error'


@pytest.mark.asyncio
async def test_invalid_websocket_message_no_id(communicator):
    await set_config('general_system_enable_anonymous', True)
    await communicator.connect()
    # Await the startup data
    await communicator.receive_json_from()

    await communicator.send_json_to({'type': 'test', 'content': 'foobar'})

    response = await communicator.receive_json_from()
    assert response['type'] == 'error'


@pytest.mark.asyncio
async def test_invalid_websocket_message_no_content(communicator):
    await set_config('general_system_enable_anonymous', True)
    await communicator.connect()
    # Await the startup data
    await communicator.receive_json_from()

    await communicator.send_json_to({'type': 'test', 'id': 'test_id'})

    response = await communicator.receive_json_from()
    assert response['type'] == 'error'


@pytest.mark.asyncio
async def test_send_unknown_type(communicator):
    await set_config('general_system_enable_anonymous', True)
    await communicator.connect()
    # Await the startup data
    await communicator.receive_json_from()

    await communicator.send_json_to({'type': 'if_you_add_this_type_to_openslides_I_will_be_sad', 'content': True, 'id': 'test_id'})

    response = await communicator.receive_json_from()
    assert response['type'] == 'error'
    assert response['in_response'] == 'test_id'
