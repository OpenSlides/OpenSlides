import json
from collections import defaultdict
from typing import (  # noqa
    TYPE_CHECKING,
    Any,
    Callable,
    Dict,
    Generator,
    Iterable,
    List,
    Optional,
    Set,
    Union,
)

from channels import Group
from channels.sessions import session_for_reply_channel
from django.conf import settings
from django.core.cache import cache, caches

if TYPE_CHECKING:
    # Dummy import Collection for mypy
    from .collection import Collection  # noqa

UserCacheDataType = Dict[int, Set[str]]


class BaseWebsocketUserCache:
    """
    Caches the reply channel names of all open websocket connections. The id of
    the user that that opened the connection is used as reference.

    This is the Base cache that has to be overriden.
    """
    cache_key = 'current_websocket_users'

    def add(self, user_id: int, channel_name: str) -> None:
        """
        Adds a channel name to an user id.
        """
        raise NotImplementedError()

    def remove(self, user_id: int, channel_name: str) -> None:
        """
        Removes one channel name from the cache.
        """
        raise NotImplementedError()

    def get_all(self) -> UserCacheDataType:
        """
        Returns all data using a dict where the key is a user id and the value
        is a set of channel_names.
        """
        raise NotImplementedError()

    def save_data(self, data: UserCacheDataType) -> None:
        """
        Saves the full data set (like created with build_data) to the cache.
        """
        raise NotImplementedError()

    def build_data(self) -> UserCacheDataType:
        """
        Creates all the data, saves it to the cache and returns it.
        """
        websocket_user_ids = defaultdict(set)  # type: UserCacheDataType
        for channel_name in Group('site').channel_layer.group_channels('site'):
            session = session_for_reply_channel(channel_name)
            user_id = session.get('user_id', None)
            websocket_user_ids[user_id or 0].add(channel_name)
        self.save_data(websocket_user_ids)
        return websocket_user_ids

    def get_cache_key(self) -> str:
        """
        Returns the cache key.
        """
        return self.cache_key


class RedisWebsocketUserCache(BaseWebsocketUserCache):
    """
    Implementation of the WebsocketUserCache that uses redis.

    This uses one cache key to store all connected user ids in a set and
    for each user another set to save the channel names.
    """

    def add(self, user_id: int, channel_name: str) -> None:
        """
        Adds a channel name to an user id.
        """
        redis = get_redis_connection()
        pipe = redis.pipeline()
        pipe.sadd(self.get_cache_key(), user_id)
        pipe.sadd(self.get_user_cache_key(user_id), channel_name)
        pipe.execute()

    def remove(self, user_id: int, channel_name: str) -> None:
        """
        Removes one channel name from the cache.
        """
        redis = get_redis_connection()
        redis.srem(self.get_user_cache_key(user_id), channel_name)

    def get_all(self) -> UserCacheDataType:
        """
        Returns all data using a dict where the key is a user id and the value
        is a set of channel_names.
        """
        redis = get_redis_connection()
        user_ids = redis.smembers(self.get_cache_key())  # type: Optional[List[str]]
        if user_ids is None:
            websocket_user_ids = self.build_data()
        else:
            websocket_user_ids = dict()
            for redis_user_id in user_ids:
                # Redis returns the id as string. So we have to convert it
                user_id = int(redis_user_id)
                channel_names = redis.smembers(self.get_user_cache_key(user_id))  # type: Optional[List[str]]
                if channel_names is not None:
                    # If channel name is empty, then we can assume, that the user
                    # has no active connection.
                    websocket_user_ids[user_id] = set(channel_names)
        return websocket_user_ids

    def save_data(self, data: UserCacheDataType) -> None:
        """
        Saves the full data set (like created with the method build_data()) to
        the cache.
        """
        redis = get_redis_connection()
        pipe = redis.pipeline()

        # Save all user ids
        pipe.delete(self.get_cache_key())
        pipe.sadd(self.get_cache_key(), *data.keys())

        for user_id, channel_names in data.items():
            pipe.delete(self.get_user_cache_key(user_id))
            pipe.sadd(self.get_user_cache_key(user_id), *channel_names)
        pipe.execute()

    def get_cache_key(self) -> str:
        """
        Returns the cache key.
        """
        return cache.make_key(self.cache_key)

    def get_user_cache_key(self, user_id: int) -> str:
        """
        Returns a cache key to save the channel names for a specific user.
        """
        return cache.make_key('{}:{}'.format(self.cache_key, user_id))


class DjangoCacheWebsocketUserCache(BaseWebsocketUserCache):
    """
    Implementation of the WebsocketUserCache that uses the django cache.

    If you use this with the inmemory cache, then you should only use one
    worker.

    This uses only one cache key to save a dict where the key is the user id and
    the value is a set of channel names.
    """

    def add(self, user_id: int, channel_name: str) -> None:
        """
        Adds a channel name for a user using the django cache.
        """
        websocket_user_ids = cache.get(self.get_cache_key())
        if websocket_user_ids is None:
            websocket_user_ids = dict()

        if user_id in websocket_user_ids:
            websocket_user_ids[user_id].add(channel_name)
        else:
            websocket_user_ids[user_id] = set([channel_name])
        cache.set(self.get_cache_key(), websocket_user_ids)

    def remove(self, user_id: int, channel_name: str) -> None:
        """
        Removes one channel name from the django cache.
        """
        websocket_user_ids = cache.get(self.get_cache_key())
        if websocket_user_ids is not None and user_id in websocket_user_ids:
            websocket_user_ids[user_id].discard(channel_name)
            cache.set(self.get_cache_key(), websocket_user_ids)

    def get_all(self) -> UserCacheDataType:
        """
        Returns the data using the django cache.
        """
        websocket_user_ids = cache.get(self.get_cache_key())
        if websocket_user_ids is None:
            return self.build_data()
        return websocket_user_ids

    def save_data(self, data: UserCacheDataType) -> None:
        """
        Saves the data using the django cache.
        """
        cache.set(self.get_cache_key(), data)


class RestrictedDataCache:
    """
    Caches all Data for a specific users.

    The cached values are expected to be formatted for outout via websocket.
    """

    base_cache_key = 'restricted_user_cache'

    def add_element(self, user_id: int, collection_string: str, id: int, data: object) -> None:
        """
        Adds one element to the cache. If the cache does not exists for the user,
        it is created.
        """
        redis = get_redis_connection()
        redis.hset(
            self.get_cache_key(user_id),
            "{}/{}".format(collection_string, id),
            json.dumps(data))

    def del_element(self, user_id: int, collection_string: str, id: int) -> None:
        """
        Removes one element from the cache.

        Does nothing if the cache does not exist.
        """
        redis = get_redis_connection()
        redis.hdel(
            self.get_cache_key(user_id),
            "{}/{}".format(collection_string, id))

    def exists_for_user(self, user_id: int) -> bool:
        """
        Returns True if the cache for the user exists, else False.
        """
        redis = get_redis_connection()
        return redis.exists(self.get_cache_key(user_id))

    def get_data(self, user_id: int) -> List[object]:
        """
        Returns all data for the user.

        The returned value is a list of the elements.
        """
        redis = get_redis_connection()
        return [json.loads(element) for element in redis.hvals(self.get_cache_key(user_id))]

    def get_cache_key(self, user_id: int) -> str:
        """
        Returns the cache key for a user.
        """
        return cache.make_key('{}:{}'.format(self.base_cache_key, user_id))


class DummyRestrictedDataCache:
    """
    Dummy RestrictedDataCache that does nothing.
    """

    def add_element(self, user_id: int, collection_string: str, id: int, data: object) -> None:
        pass

    def del_element(self, user_id: int, collection_string: str, id: int) -> None:
        pass

    def exists_for_user(self, user_id: int) -> bool:
        return False

    def get_data(self, user_id: int) -> List[object]:
        pass


def use_redis_cache() -> bool:
    """
    Returns True if Redis is used als caching backend.
    """
    try:
        from django_redis.cache import RedisCache
    except ImportError:
        return False
    return isinstance(caches['default'], RedisCache)


def get_redis_connection() -> Any:
    """
    Returns an object that can be used to talk directly to redis.
    """
    from django_redis import get_redis_connection
    return get_redis_connection("default")


if use_redis_cache():
    websocket_user_cache = RedisWebsocketUserCache()  # type: BaseWebsocketUserCache
    if settings.DISABLE_USER_CACHE:
        restricted_data_cache = DummyRestrictedDataCache()  # type: Union[RestrictedDataCache, DummyRestrictedDataCache]
    else:
        restricted_data_cache = RestrictedDataCache()
else:
    websocket_user_cache = DjangoCacheWebsocketUserCache()
    restricted_data_cache = DummyRestrictedDataCache()
