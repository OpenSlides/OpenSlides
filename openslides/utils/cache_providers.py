from collections import defaultdict
from typing import (
    TYPE_CHECKING,
    Any,
    Dict,
    Generator,
    Iterable,
    List,
    Optional,
    Set,
    Tuple,
    Union,
)

from django.apps import apps

from .utils import split_element_id, str_dict_to_bytes


if TYPE_CHECKING:
    # Dummy import Collection for mypy, can be fixed with python 3.7
    from .collection import CollectionElement  # noqa

try:
    import aioredis
except ImportError:
    no_redis_dependency = True
else:
    no_redis_dependency = False


class BaseCacheProvider:
    """
    Base class for cache provider.

    See RedisCacheProvider as reverence implementation.
    """
    full_data_cache_key = 'full_data_cache'
    restricted_user_cache_key = 'restricted_data_cache:{user_id}'
    change_id_cache_key = 'change_id_cache'
    lock_key = '_config:updating'

    def __init__(self, *args: Any) -> None:
        pass

    def get_full_data_cache_key(self) -> str:
        return self.full_data_cache_key

    def get_restricted_data_cache_key(self, user_id: int) -> str:
        return self.restricted_user_cache_key.format(user_id=user_id)

    def get_change_id_cache_key(self) -> str:
        return self.change_id_cache_key

    def clear_cache(self) -> None:
        raise NotImplementedError("CacheProvider has to implement the method clear_cache().")

    async def reset_full_cache(self, data: Dict[str, str]) -> None:
        raise NotImplementedError("CacheProvider has to implement the method reset_full_cache().")

    async def data_exists(self, user_id: Optional[int] = None) -> bool:
        raise NotImplementedError("CacheProvider has to implement the method exists_full_data().")

    async def add_elements(self, elements: List[str]) -> None:
        raise NotImplementedError("CacheProvider has to implement the method add_elements().")

    async def del_elements(self, elements: List[str], user_id: Optional[int] = None) -> None:
        raise NotImplementedError("CacheProvider has to implement the method del_elements().")

    async def add_changed_elements(self, change_id: int, element_ids: Iterable[str]) -> None:
        raise NotImplementedError("CacheProvider has to implement the method add_changed_elements().")

    async def get_all_data(self, user_id: Optional[int] = None) -> Dict[bytes, bytes]:
        raise NotImplementedError("CacheProvider has to implement the method get_all_data().")

    async def get_data_since(self, change_id: int, user_id: Optional[int] = None) -> Tuple[Dict[str, List[bytes]], List[str]]:
        raise NotImplementedError("CacheProvider has to implement the method get_data_since().")

    async def get_element(self, element_id: str) -> Optional[bytes]:
        raise NotImplementedError("CacheProvider has to implement the method get_element().")

    async def del_restricted_data(self, user_id: int) -> None:
        raise NotImplementedError("CacheProvider has to implement the method del_restricted_data().")

    async def set_lock_restricted_data(self, user_id: int) -> bool:
        raise NotImplementedError("CacheProvider has to implement the method set_lock_restricted_data().")

    async def get_lock_restricted_data(self, user_id: int) -> bool:
        raise NotImplementedError("CacheProvider has to implement the method get_lock_restricted_data().")

    async def del_lock_restricted_data(self, user_id: int) -> None:
        raise NotImplementedError("CacheProvider has to implement the method del_lock_restricted_data().")

    async def get_change_id_user(self, user_id: int) -> Optional[int]:
        raise NotImplementedError("CacheProvider has to implement the method get_change_id_user().")

    async def update_restricted_data(self, user_id: int, data: Dict[str, str]) -> None:
        raise NotImplementedError("CacheProvider has to implement the method update_restricted_data().")

    async def get_current_change_id(self) -> List[Tuple[str, int]]:
        raise NotImplementedError("CacheProvider has to implement the method get_current_change_id().")

    async def get_lowest_change_id(self) -> Optional[int]:
        raise NotImplementedError("CacheProvider has to implement the method get_lowest_change_id().")


class RedisCacheProvider(BaseCacheProvider):
    """
    Cache provider that loads and saves the data to redis.
    """
    redis_pool: Optional[aioredis.RedisConnection] = None

    def __init__(self, redis: str) -> None:
        self.redis_address = redis

    async def get_connection(self) -> 'aioredis.RedisConnection':
        """
        Returns a redis connection.
        """
        if self.redis_pool is None:
            self.redis_pool = await aioredis.create_redis_pool(self.redis_address)
        return self.redis_pool

    async def reset_full_cache(self, data: Dict[str, str]) -> None:
        """
        Deletes the cache and write new data in it.
        """
        # TODO: lua or transaction
        redis = await self.get_connection()
        await redis.delete(self.get_full_data_cache_key())
        await redis.hmset_dict(self.get_full_data_cache_key(), data)

    async def data_exists(self, user_id: Optional[int] = None) -> bool:
        """
        Returns True, when there is data in the cache.

        If user_id is None, the method tests for full_data. If user_id is an int, it tests
        for the restricted_data_cache for the user with the user_id. 0 is for anonymous.
        """
        redis = await self.get_connection()
        if user_id is None:
            cache_key = self.get_full_data_cache_key()
        else:
            cache_key = self.get_restricted_data_cache_key(user_id)
        return await redis.exists(cache_key)

    async def add_elements(self, elements: List[str]) -> None:
        """
        Add or change elements to the cache.

        elements is a list with an even len. the odd values are the element_ids and the even
        values are the elements. The elements have to be encoded, for example with json.
        """
        redis = await self.get_connection()
        await redis.hmset(
            self.get_full_data_cache_key(),
            *elements)

    async def del_elements(self, elements: List[str], user_id: Optional[int] = None) -> None:
        """
        Deletes elements from the cache.

        elements has to be a list of element_ids.

        If user_id is None, the elements are deleted from the full_data cache. If user_id is an
        int, the elements are deleted one restricted_data_cache. 0 is for anonymous.
        """
        redis = await self.get_connection()
        if user_id is None:
            cache_key = self.get_full_data_cache_key()
        else:
            cache_key = self.get_restricted_data_cache_key(user_id)
        await redis.hdel(
            cache_key,
            *elements)

    async def add_changed_elements(self, change_id: int, element_ids: Iterable[str]) -> None:
        """
        Saves which elements are change with a change_id.

        args has to be an even iterable. The odd values have to be a change id (int) and the
        even values have to be element_ids.
        """
        def zadd_args(change_id: int) -> Generator[Union[int, str], None, None]:
            """
            Small helper to generates the arguments for the redis command zadd.
            """
            for element_id in element_ids:
                yield change_id
                yield element_id

        redis = await self.get_connection()
        await redis.zadd(self.get_change_id_cache_key(), *zadd_args(change_id))
        # Saves the lowest_change_id if it does not exist
        await redis.zadd(self.get_change_id_cache_key(), change_id, '_config:lowest_change_id', exist='ZSET_IF_NOT_EXIST')

    async def get_all_data(self, user_id: Optional[int] = None) -> Dict[bytes, bytes]:
        """
        Returns all data from a cache.

        if user_id is None, then the data is returned from the full_data_cache. If it is and
        int, it is returned from a restricted_data_cache. 0 is for anonymous.
        """
        if user_id is None:
            cache_key = self.get_full_data_cache_key()
        else:
            cache_key = self.get_restricted_data_cache_key(user_id)
        redis = await self.get_connection()
        return await redis.hgetall(cache_key)

    async def get_element(self, element_id: str) -> Optional[bytes]:
        """
        Returns one element from the full_data_cache.

        Returns None, when the element does not exist.
        """
        redis = await self.get_connection()
        return await redis.hget(
            self.get_full_data_cache_key(),
            element_id)

    async def get_data_since(self, change_id: int, user_id: Optional[int] = None) -> Tuple[Dict[str, List[bytes]], List[str]]:
        """
        Returns all elements since a change_id.

        The returend value is a two element tuple. The first value is a dict the elements where
        the key is the collection_string and the value a list of (json-) encoded elements. The
        second element is a list of element_ids, that have been deleted since the change_id.

        if user_id is None, the full_data is returned. If user_id is an int, the restricted_data
        for an user is used. 0 is for the anonymous user.
        """
        # TODO: rewrite with lua to get all elements with one request
        redis = await self.get_connection()
        changed_elements: Dict[str, List[bytes]] = defaultdict(list)
        deleted_elements: List[str] = []
        for element_id in await redis.zrangebyscore(self.get_change_id_cache_key(), min=change_id):
            if element_id.startswith(b'_config'):
                continue
            element_json = await redis.hget(self.get_full_data_cache_key(), element_id)  # Optional[bytes]
            if element_json is None:
                # The element is not in the cache. It has to be deleted.
                deleted_elements.append(element_id)
            else:
                collection_string, id = split_element_id(element_id)
                changed_elements[collection_string].append(element_json)
        return changed_elements, deleted_elements

    async def del_restricted_data(self, user_id: int) -> None:
        """
        Deletes all restricted_data for an user. 0 is for the anonymous user.
        """
        redis = await self.get_connection()
        await redis.delete(self.get_restricted_data_cache_key(user_id))

    async def set_lock_restricted_data(self, user_id: int) -> bool:
        """
        Tries to sets a lock for the restricted_data of an user.

        Returns True when the lock could be set.

        Returns False when the lock was already set.
        """
        redis = await self.get_connection()
        return await redis.hsetnx(self.get_restricted_data_cache_key(user_id), self.lock_key, 1)

    async def get_lock_restricted_data(self, user_id: int) -> bool:
        """
        Returns True, when the lock for the restricted_data of an user is set. Else False.
        """
        redis = await self.get_connection()
        return await redis.hget(self.get_restricted_data_cache_key(user_id), self.lock_key)

    async def del_lock_restricted_data(self, user_id: int) -> None:
        """
        Deletes the lock for the restricted_data of an user. Does nothing when the
        lock is not set.
        """
        redis = await self.get_connection()
        await redis.hdel(self.get_restricted_data_cache_key(user_id), self.lock_key)

    async def get_change_id_user(self, user_id: int) -> Optional[int]:
        """
        Get the change_id for the restricted_data of an user.

        This is the change_id where the restricted_data was last calculated.
        """
        redis = await self.get_connection()
        return await redis.hget(self.get_restricted_data_cache_key(user_id), '_config:change_id')

    async def update_restricted_data(self, user_id: int, data: Dict[str, str]) -> None:
        """
        Updates the restricted_data for an user.

        data has to be a dict where the key is an element_id and the value the (json-) encoded
        element.
        """
        redis = await self.get_connection()
        await redis.hmset_dict(self.get_restricted_data_cache_key(user_id), data)

    async def get_current_change_id(self) -> List[Tuple[str, int]]:
        """
        Get the highest change_id from redis.
        """
        redis = await self.get_connection()
        return await redis.zrevrangebyscore(
            self.get_change_id_cache_key(),
            withscores=True,
            count=1,
            offset=0)

    async def get_lowest_change_id(self) -> Optional[int]:
        """
        Get the lowest change_id from redis.

        Returns None if lowest score does not exist.
        """
        redis = await self.get_connection()
        return await redis.zscore(
            self.get_change_id_cache_key(),
            '_config:lowest_change_id')


class MemmoryCacheProvider(BaseCacheProvider):
    """
    CacheProvider for the ElementCache that uses only the memory.

    See the RedisCacheProvider for a description of the methods.

    This provider supports only one process. It saves the data into the memory.
    When you use different processes they will use diffrent data.
    """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        self.clear_cache()

    def clear_cache(self) -> None:
        self.full_data: Dict[str, str] = {}
        self.restricted_data: Dict[int, Dict[str, str]] = {}
        self.change_id_data: Dict[int, Set[str]] = {}

    async def reset_full_cache(self, data: Dict[str, str]) -> None:
        self.full_data = data

    async def data_exists(self, user_id: Optional[int] = None) -> bool:
        if user_id is None:
            cache_dict = self.full_data
        else:
            cache_dict = self.restricted_data.get(user_id, {})

        return bool(cache_dict)

    async def add_elements(self, elements: List[str]) -> None:
        if len(elements) % 2:
            raise ValueError("The argument elements of add_elements has to be a list with an even number of elements.")

        for i in range(0, len(elements), 2):
            self.full_data[elements[i]] = elements[i+1]

    async def del_elements(self, elements: List[str], user_id: Optional[int] = None) -> None:
        if user_id is None:
            cache_dict = self.full_data
        else:
            cache_dict = self.restricted_data.get(user_id, {})

        for element in elements:
            try:
                del cache_dict[element]
            except KeyError:
                pass

    async def add_changed_elements(self, change_id: int, element_ids: Iterable[str]) -> None:
        element_ids = list(element_ids)

        for element_id in element_ids:
            if change_id in self.change_id_data:
                self.change_id_data[change_id].add(element_id)
            else:
                self.change_id_data[change_id] = {element_id}

    async def get_all_data(self, user_id: Optional[int] = None) -> Dict[bytes, bytes]:
        if user_id is None:
            cache_dict = self.full_data
        else:
            cache_dict = self.restricted_data.get(user_id, {})

        return str_dict_to_bytes(cache_dict)

    async def get_element(self, element_id: str) -> Optional[bytes]:
        value = self.full_data.get(element_id, None)
        return value.encode() if value is not None else None

    async def get_data_since(
            self, change_id: int, user_id: Optional[int] = None) -> Tuple[Dict[str, List[bytes]], List[str]]:
        changed_elements: Dict[str, List[bytes]] = defaultdict(list)
        deleted_elements: List[str] = []
        if user_id is None:
            cache_dict = self.full_data
        else:
            cache_dict = self.restricted_data.get(user_id, {})

        for data_change_id, element_ids in self.change_id_data.items():
            if data_change_id < change_id:
                continue
            for element_id in element_ids:
                element_json = cache_dict.get(element_id, None)
                if element_json is None:
                    deleted_elements.append(element_id)
                else:
                    collection_string, id = split_element_id(element_id)
                    changed_elements[collection_string].append(element_json.encode())
        return changed_elements, deleted_elements

    async def del_restricted_data(self, user_id: int) -> None:
        try:
            del self.restricted_data[user_id]
        except KeyError:
            pass

    async def set_lock_restricted_data(self, user_id: int) -> bool:
        data = self.restricted_data.setdefault(user_id, {})
        if self.lock_key in data:
            return False
        data[self.lock_key] = "1"
        return True

    async def get_lock_restricted_data(self, user_id: int) -> bool:
        data = self.restricted_data.get(user_id, {})
        return self.lock_key in data

    async def del_lock_restricted_data(self, user_id: int) -> None:
        data = self.restricted_data.get(user_id, {})
        try:
            del data[self.lock_key]
        except KeyError:
            pass

    async def get_change_id_user(self, user_id: int) -> Optional[int]:
        data = self.restricted_data.get(user_id, {})
        change_id = data.get('_config:change_id', None)
        return int(change_id) if change_id is not None else None

    async def update_restricted_data(self, user_id: int, data: Dict[str, str]) -> None:
        redis_data = self.restricted_data.setdefault(user_id, {})
        redis_data.update(data)

    async def get_current_change_id(self) -> List[Tuple[str, int]]:
        change_data = self.change_id_data
        if change_data:
            return [('no_usefull_value', max(change_data.keys()))]
        return []

    async def get_lowest_change_id(self) -> Optional[int]:
        change_data = self.change_id_data
        if change_data:
            return min(change_data.keys())
        return None


class Cachable:
    """
    A Cachable is an object that returns elements that can be cached.

    It needs at least the methods defined here.
    """

    def get_collection_string(self) -> str:
        """
        Returns the string representing the name of the cachable.
        """
        raise NotImplementedError("Cachable has to implement the method get_collection_string().")

    def get_elements(self) -> List[Dict[str, Any]]:
        """
        Returns all elements of the cachable.
        """
        raise NotImplementedError("Cachable has to implement the method get_collection_string().")

    def restrict_elements(
            self,
            user: Optional['CollectionElement'],
            elements: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Converts full_data to restricted_data.

        elements can be an empty list, a list with some elements of the cachable or with all
        elements of the cachable.

        The default implementation returns the full_data.
        """
        return elements


def get_all_cachables() -> List[Cachable]:
    """
    Returns all element of OpenSlides.
    """
    out: List[Cachable] = []
    for app in apps.get_app_configs():
        try:
            # Get the method get_startup_elements() from an app.
            # This method has to return an iterable of Collection objects.
            get_startup_elements = app.get_startup_elements
        except AttributeError:
            # Skip apps that do not implement get_startup_elements.
            continue
        out.extend(get_startup_elements())
    return out
