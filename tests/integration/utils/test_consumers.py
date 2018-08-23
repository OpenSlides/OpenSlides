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
async def communicator(request, event_loop):
    communicator = WebsocketCommunicator(application, "/ws/site/")
    yield communicator
    await communicator.disconnect()


@pytest.mark.asyncio
async def test_normal_connection(communicator):
    await set_config('general_system_enable_anonymous', True)
    await communicator.connect()

    response = await communicator.receive_json_from()

    # Test, that there is a lot of startup data.
    assert len(response) > 5


@pytest.mark.asyncio
async def test_receive_changed_data(communicator):
    await set_config('general_system_enable_anonymous', True)
    await communicator.connect()
    await communicator.receive_json_from()

    # Change a config value after the startup data has been received
    await set_config('general_event_name', 'Test Event')
    response = await communicator.receive_json_from()

    id = config.get_key_to_id()['general_event_name']
    assert response == [
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

    assert response == [{'action': 'deleted', 'collection': Collection1().get_collection_string(), 'id': 1}]


@pytest.mark.asyncio
async def test_send_invalid_notify_not_a_list(communicator):
    await set_config('general_system_enable_anonymous', True)
    await communicator.connect()
    # Await the startup data
    await communicator.receive_json_from()

    await communicator.send_json_to({'testmessage': 'foobar, what else.'})

    response = await communicator.receive_json_from()

    assert response == {'error': 'invalid message'}


@pytest.mark.asyncio
async def test_send_invalid_notify_no_elements(communicator):
    await set_config('general_system_enable_anonymous', True)
    await communicator.connect()
    # Await the startup data
    await communicator.receive_json_from()

    await communicator.send_json_to([])

    response = await communicator.receive_json_from()

    assert response == {'error': 'invalid message'}


@pytest.mark.asyncio
async def test_send_invalid_notify_str_in_list(communicator):
    await set_config('general_system_enable_anonymous', True)
    await communicator.connect()
    # Await the startup data
    await communicator.receive_json_from()

    await communicator.send_json_to([{}, 'testmessage'])

    response = await communicator.receive_json_from()

    assert response == {'error': 'invalid message'}


@pytest.mark.asyncio
async def test_send_valid_notify(communicator):
    await set_config('general_system_enable_anonymous', True)
    await communicator.connect()
    # Await the startup data
    await communicator.receive_json_from()

    await communicator.send_json_to([{'testmessage': 'foobar, what else.'}])

    response = await communicator.receive_json_from()

    assert isinstance(response, list)
    assert len(response) == 1
    assert response[0]['testmessage'] == 'foobar, what else.'
    assert 'senderReplyChannelName' in response[0]
    assert response[0]['senderUserId'] == 0
