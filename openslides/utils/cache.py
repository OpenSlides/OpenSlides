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
    Type,
    Union,
    Tuple,
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


class FullDataCache:
    """
    Caches all data as full data.

    Helps to get all data from one collection.
    """

    base_cache_key = 'full_data_cache'

    def build_for_collection(self, collection_string: str) -> None:
        """
        Build the cache for collection from a django model.

        Rebuilds the cache for that collection, if it already exists.
        """
        redis = get_redis_connection()
        pipe = redis.pipeline()

        # Clear the cache for collection
        pipe.delete(self.get_cache_key(collection_string))

        # Save all elements
        from .collection import get_model_from_collection_string
        model = get_model_from_collection_string(collection_string)
        try:
            query = model.objects.get_full_queryset()
        except AttributeError:
            # If the model des not have to method get_full_queryset(), then use
            # the default queryset from django.
            query = model.objects

        # Build a dict from the instance id to the full_data
        mapping = {instance.pk: json.dumps(model.get_access_permissions().get_full_data(instance))
                   for instance in query.all()}

        if mapping:
            # Save the dict into a redis map, if there is at least one value
            pipe.hmset(
                self.get_cache_key(collection_string),
                mapping)

        pipe.execute()

    def add_element(self, collection_string: str, id: int, data: Dict[str, Any]) -> None:
        """
        Adds one element to the cache. If the cache does not exists for the collection,
        it is created.
        """
        redis = get_redis_connection()

        # If the cache does not exist for the collection, then create it first.
        if not self.exists_for_collection(collection_string):
            self.build_for_collection(collection_string)

        redis.hset(
            self.get_cache_key(collection_string),
            id,
            json.dumps(data))

    def del_element(self, collection_string: str, id: int) -> None:
        """
        Removes one element from the cache.

        Does nothing if the cache does not exist.
        """
        redis = get_redis_connection()
        redis.hdel(
            self.get_cache_key(collection_string),
            id)

    def exists_for_collection(self, collection_string: str) -> bool:
        """
        Returns True if the cache for the collection exists, else False.
        """
        redis = get_redis_connection()
        return redis.exists(self.get_cache_key(collection_string))

    def get_data(self, collection_string: str) -> List[Dict[str, Any]]:
        """
        Returns all data for the collection.
        """
        redis = get_redis_connection()
        return [json.loads(element.decode()) for element in redis.hvals(self.get_cache_key(collection_string))]

    def get_element(self, collection_string: str, id: int) -> Dict[str, Any]:
        """
        Returns one element from the collection.

        Raises model.DoesNotExist if the element is not in the cache.
        """
        redis = get_redis_connection()
        element = redis.hget(self.get_cache_key(collection_string), id)
        if element is None:
            from .collection import get_model_from_collection_string
            model = get_model_from_collection_string(collection_string)
            raise model.DoesNotExist(collection_string, id)
        return json.loads(element.decode())

    def get_cache_key(self, collection_string: str) -> str:
        """
        Returns the cache key for a collection.
        """
        return cache.make_key('{}:{}'.format(self.base_cache_key, collection_string))


class DummyFullDataCache:
    """
    Dummy FullDataCache that does nothing.
    """
    def build_for_collection(self, collection_string: str) -> None:
        pass

    def add_element(self, collection_string: str, id: int, data: Dict[str, Any]) -> None:
        pass

    def del_element(self, collection_string: str, id: int) -> None:
        pass

    def exists_for_collection(self, collection_string: str) -> bool:
        return False

    def get_data(self, collection_string: str) -> List[Dict[str, Any]]:
        from .collection import get_model_from_collection_string
        model = get_model_from_collection_string(collection_string)
        try:
            query = model.objects.get_full_queryset()
        except AttributeError:
            # If the model des not have to method get_full_queryset(), then use
            # the default queryset from django.
            query = model.objects

        return [model.get_access_permissions().get_full_data(instance)
                for instance in query.all()]

    def get_element(self, collection_string: str, id: int) -> Dict[str, Any]:
        from .collection import get_model_from_collection_string
        model = get_model_from_collection_string(collection_string)
        try:
            query = model.objects.get_full_queryset()
        except AttributeError:
            # If the model des not have to method get_full_queryset(), then use
            # the default queryset from django.
            query = model.objects

        return model.get_access_permissions().get_full_data(query.get(pk=id))


class RestrictedDataCache:
    """
    Caches all data for a specific users.

    Helps to get all data from all collections for a specific user.

    The cached values are expected to be formatted for outout via websocket.
    """

    base_cache_key = 'restricted_user_cache'

    def update_element(self, user_id: int, collection_string: str, id: int, data: object) -> None:
        """
        Adds on element to the cache only if the cache exists for the user.

        Note: This method is not atomic. So in very rare cases it is possible
        that the restricted date cache can become corrupt. The best solution would be to
        use a lua script instead. See also #3427.
        """
        if self.exists_for_user(user_id):
            self.add_element(user_id, collection_string, id, data)

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

    def del_user(self, user_id: int) -> None:
        """
        Removes all elements for one user from the cache.
        """
        redis = get_redis_connection()
        redis.delete(self.get_cache_key(user_id))

    def del_all(self) -> None:
        """
        Deletes all elements from the cache.

        This method uses the redis command SCAN. See
        https://redis.io/commands/scan#scan-guarantees for its limitations. If
        an element is added to the cache while del_all() is in process, it is
        possible, that it is not deleted.
        """
        redis = get_redis_connection()

        # Get all keys that start with self.base_cache_key and delete them
        match = cache.make_key('{}:*'.format(self.base_cache_key))
        cursor = 0
        while True:
            cursor, keys = redis.scan(cursor, match)
            for key in keys:
                redis.delete(key)
            if cursor == 0:
                return

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
        return [json.loads(element.decode()) for element in redis.hvals(self.get_cache_key(user_id))]

    def get_element(self, user_id: int, collection_string: str, id: int) -> Dict[str, Any]:
        redis = get_redis_connection()
        return redis.hget(self.get_cache_key(user_id), "{}/{}".format(collection_string, id)).decode()

    def get_cache_key(self, user_id: int) -> str:
        """
        Returns the cache key for a user.
        """
        return cache.make_key('{}:{}'.format(self.base_cache_key, user_id))


class DummyRestrictedDataCache:
    """
    Dummy RestrictedDataCache that does nothing.
    """

    def update_element(self, user_id: int, collection_string: str, id: int, data: object) -> None:
        pass

    def add_element(self, user_id: int, collection_string: str, id: int, data: object) -> None:
        pass

    def del_element(self, user_id: int, collection_string: str, id: int) -> None:
        pass

    def del_user(self, user_id: int) -> None:
        pass

    def del_all(self) -> None:
        pass

    def exists_for_user(self, user_id: int) -> bool:
        return False

    def get_data(self, user_id: int) -> List[object]:
        pass

    def get_element(self, user_id: int, collection_string: str, id: int) -> Dict[str, Any]:
        pass


class ChangeIDCache:
    """
    Saves the changed object together with an ingresing number
    """

    base_cache_key = 'change_id_cache'
    change_id_key = 'change_id'

    def add_elements(self, elements: Iterable[Tuple[str, int]]) -> None:
        """
        Add an element to the cache.
        """
        redis = get_redis_connection()
        change_id = self.get_change_id()
        for element in elements:
            redis.zadd(self.get_cache_key(), change_id, "{}:{}".format(element[0], element[1]))

    def get_elements(self, change_id: int) -> List[str]:
        """
        Returns all changed elements after the change_id as element-id.
        """
        redis = get_redis_connection()
        return [e.decode() for e in redis.zrangebyscore(self.get_cache_key(), change_id + 1, "+inf")]

    def get_elements_full_data(self, change_id: int) -> List[Dict[str, Any]]:
        """
        Returns all changed elements after the change_id as full_data.
        """
        # TODO: Rewrite with lua
        out = []  # type: List[Dict[str, Any]]
        for element in self.get_elements(change_id):
            collection_string, id = element.rsplit(':', 1)
            out.append(full_data_cache.get_element(collection_string, int(id)))
        return out

    def get_elements_restricted_data(self, user_id: int, change_id: int) -> List[object]:
        """
        Returns all changed elements after the change_id as restricted_data.

        Raises a runtime error, if the cache does not exist for the user.
        """
        if not restricted_data_cache.exists_for_user(user_id):
            raise RuntimeError("Cache for user {} does not exist.".format(user_id))

        # TODO: Rewrite with lua
        out = []  # type: List[object]
        for element in self.get_elements(change_id):
            collection_string, id = element.rsplit(':', 1)
            out.append(restricted_data_cache.get_element(user_id, collection_string, int(id)))
        return out

    def get_cache_key(self) -> str:
        """
        Returns the cache key for the cache.
        """
        return cache.make_key(self.base_cache_key)

    def get_change_id(self) -> int:
        """
        Returns a new change id
        """
        redis = get_redis_connection()
        return redis.incr(cache.make_key(self.change_id_key))


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
    full_data_cache = FullDataCache()  # type: Union[FullDataCache, DummyFullDataCache]
    change_id_cache = ChangeIDCache()
else:
    websocket_user_cache = DjangoCacheWebsocketUserCache()
    restricted_data_cache = DummyRestrictedDataCache()
    full_data_cache = DummyFullDataCache()
