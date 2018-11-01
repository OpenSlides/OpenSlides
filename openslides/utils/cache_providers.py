from collections import defaultdict
from typing import (
    TYPE_CHECKING,
    Any,
    Dict,
    Iterable,
    List,
    Optional,
    Set,
    Tuple,
)

from django.apps import apps
from typing_extensions import Protocol

from .redis import use_redis
from .utils import split_element_id, str_dict_to_bytes


if use_redis:
    from .redis import get_connection, aioredis


if TYPE_CHECKING:
    # Dummy import Collection for mypy, can be fixed with python 3.7
    from .collection import CollectionElement  # noqa


class ElementCacheProvider(Protocol):
    """
    Base class for cache provider.

    See RedisCacheProvider as reverence implementation.
    """

    async def clear_cache(self) -> None: ...

    async def reset_full_cache(self, data: Dict[str, str]) -> None: ...

    async def data_exists(self, user_id: Optional[int] = None) -> bool: ...

    async def add_elements(self, elements: List[str]) -> None: ...

    async def del_elements(self, elements: List[str], user_id: Optional[int] = None) -> None: ...

    async def add_changed_elements(self, default_change_id: int, element_ids: Iterable[str]) -> int: ...

    async def get_all_data(self, user_id: Optional[int] = None) -> Dict[bytes, bytes]: ...

    async def get_data_since(
            self,
            change_id: int,
            user_id: Optional[int] = None,
            max_change_id: int = -1) -> Tuple[Dict[str, List[bytes]], List[str]]: ...

    async def get_element(self, element_id: str, user_id: Optional[int] = None) -> Optional[bytes]: ...

    async def del_restricted_data(self, user_id: int) -> None: ...

    async def set_lock(self, lock_name: str) -> bool: ...

    async def get_lock(self, lock_name: str) -> bool: ...

    async def del_lock(self, lock_name: str) -> None: ...

    async def get_change_id_user(self, user_id: int) -> Optional[int]: ...

    async def update_restricted_data(self, user_id: int, data: Dict[str, str]) -> None: ...

    async def get_current_change_id(self) -> List[Tuple[str, int]]: ...

    async def get_lowest_change_id(self) -> Optional[int]: ...


class RedisCacheProvider:
    """
    Cache provider that loads and saves the data to redis.
    """
    full_data_cache_key: str = 'full_data'
    restricted_user_cache_key: str = 'restricted_data:{user_id}'
    change_id_cache_key: str = 'change_id'
    prefix: str = 'element_cache_'

    def get_full_data_cache_key(self) -> str:
        return "".join((self.prefix, self.full_data_cache_key))

    def get_restricted_data_cache_key(self, user_id: int) -> str:
        return "".join((self.prefix, self.restricted_user_cache_key.format(user_id=user_id)))

    def get_change_id_cache_key(self) -> str:
        return "".join((self.prefix, self.change_id_cache_key))

    async def clear_cache(self) -> None:
        """
        Deleted all cache entries created with this element cache.
        """
        async with get_connection() as redis:
            await redis.eval("return redis.call('del', 'fake_key', unpack(redis.call('keys', ARGV[1])))", keys=[], args=["{}*".format(self.prefix)])

    async def reset_full_cache(self, data: Dict[str, str]) -> None:
        """
        Deletes the full_data_cache and write new data in it.
        """
        async with get_connection() as redis:
            tr = redis.multi_exec()
            tr.delete(self.get_full_data_cache_key())
            tr.hmset_dict(self.get_full_data_cache_key(), data)
            await tr.execute()

    async def data_exists(self, user_id: Optional[int] = None) -> bool:
        """
        Returns True, when there is data in the cache.

        If user_id is None, the method tests for full_data. If user_id is an int, it tests
        for the restricted_data_cache for the user with the user_id. 0 is for anonymous.
        """
        async with get_connection() as redis:
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
        async with get_connection() as redis:
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
        async with get_connection() as redis:
            if user_id is None:
                cache_key = self.get_full_data_cache_key()
            else:
                cache_key = self.get_restricted_data_cache_key(user_id)
            await redis.hdel(
                cache_key,
                *elements)

    async def add_changed_elements(self, default_change_id: int, element_ids: Iterable[str]) -> int:
        """
        Saves which elements are change with a change_id.

        Generates and returns the change_id.
        """
        async with get_connection() as redis:
            return int(await redis.eval(
                lua_script_change_data,
                keys=[self.get_change_id_cache_key()],
                args=[default_change_id, *element_ids]
            ))

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

        async with get_connection() as redis:
            return await redis.hgetall(cache_key)

    async def get_element(self, element_id: str, user_id: Optional[int] = None) -> Optional[bytes]:
        """
        Returns one element from the cache.

        Returns None, when the element does not exist.
        """
        if user_id is None:
            cache_key = self.get_full_data_cache_key()
        else:
            cache_key = self.get_restricted_data_cache_key(user_id)

        async with get_connection() as redis:
            return await redis.hget(
                cache_key,
                element_id)

    async def get_data_since(
            self,
            change_id: int,
            user_id: Optional[int] = None,
            max_change_id: int = -1) -> Tuple[Dict[str, List[bytes]], List[str]]:
        """
        Returns all elements since a change_id.

        The returend value is a two element tuple. The first value is a dict the elements where
        the key is the collection_string and the value a list of (json-) encoded elements. The
        second element is a list of element_ids, that have been deleted since the change_id.

        if user_id is None, the full_data is returned. If user_id is an int, the restricted_data
        for an user is used. 0 is for the anonymous user.
        """
        changed_elements: Dict[str, List[bytes]] = defaultdict(list)
        deleted_elements: List[str] = []
        if user_id is None:
            cache_key = self.get_full_data_cache_key()
        else:
            cache_key = self.get_restricted_data_cache_key(user_id)

        # Convert max_change_id to a string. If its negative, use the string '+inf'
        redis_max_change_id = "+inf" if max_change_id < 0 else str(max_change_id)
        async with get_connection() as redis:
            # lua script that returns gets all element_ids from change_id_cache_key
            # and then uses each element_id on full_data or restricted_data.
            # It returns a list where the odd values are the change_id and the
            # even values the element as json. The function wait_make_dict creates
            # a python dict from the returned list.
            elements: Dict[bytes, Optional[bytes]] = await aioredis.util.wait_make_dict(redis.eval(
                """
                -- Get change ids of changed elements
                local element_ids = redis.call('zrangebyscore', KEYS[1], ARGV[1], ARGV[2])

                -- Save elements in array. Rotate element_id and element_json
                local elements = {}
                for _, element_id in pairs(element_ids) do
                  table.insert(elements, element_id)
                  table.insert(elements, redis.call('hget', KEYS[2], element_id))
                end
                return elements
                """,
                keys=[self.get_change_id_cache_key(), cache_key],
                args=[change_id, redis_max_change_id]))

        for element_id, element_json in elements.items():
            if element_id.startswith(b'_config'):
                # Ignore config values from the change_id cache key
                continue
            if element_json is None:
                # The element is not in the cache. It has to be deleted.
                deleted_elements.append(element_id.decode())
            else:
                collection_string, id = split_element_id(element_id)
                changed_elements[collection_string].append(element_json)
        return changed_elements, deleted_elements

    async def del_restricted_data(self, user_id: int) -> None:
        """
        Deletes all restricted_data for an user. 0 is for the anonymous user.
        """
        async with get_connection() as redis:
            await redis.delete(self.get_restricted_data_cache_key(user_id))

    async def set_lock(self, lock_name: str) -> bool:
        """
        Tries to sets a lock.

        Returns True when the lock could be set.

        Returns False when the lock was already set.
        """
        # TODO: Improve lock. See: https://redis.io/topics/distlock
        async with get_connection() as redis:
            return await redis.setnx("{}lock_{}".format(self.prefix, lock_name), 1)

    async def get_lock(self, lock_name: str) -> bool:
        """
        Returns True, when the lock for the restricted_data of an user is set. Else False.
        """
        async with get_connection() as redis:
            return await redis.get("{}lock_{}".format(self.prefix, lock_name))

    async def del_lock(self, lock_name: str) -> None:
        """
        Deletes the lock for the restricted_data of an user. Does nothing when the
        lock is not set.
        """
        async with get_connection() as redis:
            await redis.delete("{}lock_{}".format(self.prefix, lock_name))

    async def get_change_id_user(self, user_id: int) -> Optional[int]:
        """
        Get the change_id for the restricted_data of an user.

        This is the change_id where the restricted_data was last calculated.
        """
        async with get_connection() as redis:
            return await redis.hget(self.get_restricted_data_cache_key(user_id), '_config:change_id')

    async def update_restricted_data(self, user_id: int, data: Dict[str, str]) -> None:
        """
        Updates the restricted_data for an user.

        data has to be a dict where the key is an element_id and the value the (json-) encoded
        element.
        """
        async with get_connection() as redis:
            await redis.hmset_dict(self.get_restricted_data_cache_key(user_id), data)

    async def get_current_change_id(self) -> List[Tuple[str, int]]:
        """
        Get the highest change_id from redis.
        """
        async with get_connection() as redis:
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
        async with get_connection() as redis:
            return await redis.zscore(
                self.get_change_id_cache_key(),
                '_config:lowest_change_id')


class MemmoryCacheProvider:
    """
    CacheProvider for the ElementCache that uses only the memory.

    See the RedisCacheProvider for a description of the methods.

    This provider supports only one process. It saves the data into the memory.
    When you use different processes they will use diffrent data.
    """

    def __init__(self) -> None:
        self.set_data_dicts()

    def set_data_dicts(self) -> None:
        self.full_data: Dict[str, str] = {}
        self.restricted_data: Dict[int, Dict[str, str]] = {}
        self.change_id_data: Dict[int, Set[str]] = {}
        self.locks: Dict[str, str] = {}

    async def clear_cache(self) -> None:
        self.set_data_dicts()

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

    async def add_changed_elements(self, default_change_id: int, element_ids: Iterable[str]) -> int:
        element_ids = list(element_ids)
        try:
            change_id = (await self.get_current_change_id())[0][1] + 1
        except IndexError:
            change_id = default_change_id

        for element_id in element_ids:
            if change_id in self.change_id_data:
                self.change_id_data[change_id].add(element_id)
            else:
                self.change_id_data[change_id] = {element_id}
        return change_id

    async def get_all_data(self, user_id: Optional[int] = None) -> Dict[bytes, bytes]:
        if user_id is None:
            cache_dict = self.full_data
        else:
            cache_dict = self.restricted_data.get(user_id, {})

        return str_dict_to_bytes(cache_dict)

    async def get_element(self, element_id: str, user_id: Optional[int] = None) -> Optional[bytes]:
        if user_id is None:
            cache_dict = self.full_data
        else:
            cache_dict = self.restricted_data.get(user_id, {})

        value = cache_dict.get(element_id, None)
        return value.encode() if value is not None else None

    async def get_data_since(
            self,
            change_id: int,
            user_id: Optional[int] = None,
            max_change_id: int = -1) -> Tuple[Dict[str, List[bytes]], List[str]]:
        changed_elements: Dict[str, List[bytes]] = defaultdict(list)
        deleted_elements: List[str] = []
        if user_id is None:
            cache_dict = self.full_data
        else:
            cache_dict = self.restricted_data.get(user_id, {})

        for data_change_id, element_ids in self.change_id_data.items():
            if data_change_id < change_id or (max_change_id > -1 and data_change_id > max_change_id):
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

    async def set_lock(self, lock_name: str) -> bool:
        if lock_name in self.locks:
            return False
        self.locks[lock_name] = "1"
        return True

    async def get_lock(self, lock_name: str) -> bool:
        return lock_name in self.locks

    async def del_lock(self, lock_name: str) -> None:
        try:
            del self.locks[lock_name]
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


class Cachable(Protocol):
    """
    A Cachable is an object that returns elements that can be cached.

    It needs at least the methods defined here.
    """

    def get_collection_string(self) -> str:
        """
        Returns the string representing the name of the cachable.
        """

    def get_elements(self) -> List[Dict[str, Any]]:
        """
        Returns all elements of the cachable.
        """

    async def restrict_elements(
            self,
            user: Optional['CollectionElement'],
            elements: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Converts full_data to restricted_data.

        elements can be an empty list, a list with some elements of the cachable or with all
        elements of the cachable.
        """


def get_all_cachables() -> List[Cachable]:
    """
    Returns all element of OpenSlides.
    """
    out: List[Cachable] = []
    for app in apps.get_app_configs():
        try:
            # Get the method get_startup_elements() from an app.
            # This method has to return an iterable of Cachable objects.
            get_startup_elements = app.get_startup_elements
        except AttributeError:
            # Skip apps that do not implement get_startup_elements.
            continue
        out.extend(get_startup_elements())
    return out


lua_script_change_data = """
-- Generate a new change_id
local tmp = redis.call('zrevrangebyscore', KEYS[1], '+inf', '-inf', 'WITHSCORES', 'LIMIT', 0, 1)
local change_id
if next(tmp) == nil then
    -- The key does not exist
    change_id = ARGV[1]
else
    change_id = tmp[2] + 1
end

-- Add elements to sorted set
local count = 2
while ARGV[count] do
    redis.call('zadd', KEYS[1], change_id, ARGV[count])
    count = count + 1
end

-- Set lowest_change_id if it does not exist
redis.call('zadd', KEYS[1], 'NX', change_id, '_config:lowest_change_id')

return change_id
"""
