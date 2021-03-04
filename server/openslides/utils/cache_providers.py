import functools
import hashlib
from textwrap import dedent
from typing import Any, Callable, Coroutine, Dict, List, Optional, Set, Tuple

from django.core.exceptions import ImproperlyConfigured
from typing_extensions import Protocol

from . import logging
from .redis import use_redis
from .schema_version import SchemaVersion
from .utils import split_element_id, str_dict_to_bytes


logger = logging.getLogger(__name__)

if use_redis:
    from .redis import aioredis, get_connection


class CacheReset(Exception):
    pass


class ElementCacheProvider(Protocol):
    """
    Base class for cache provider.

    See RedisCacheProvider as reverence implementation.
    """

    def __init__(self, ensure_cache: Callable[[], Coroutine[Any, Any, None]]) -> None:
        ...

    async def ensure_cache(self) -> None:
        ...

    async def clear_cache(self) -> None:
        ...

    async def reset_full_cache(
        self, data: Dict[str, str], default_change_id: int
    ) -> None:
        ...

    async def add_to_full_data(self, data: Dict[str, str]) -> None:
        ...

    async def data_exists(self) -> bool:
        ...

    async def set_cache_ready(self) -> None:
        ...

    async def get_all_data(self) -> Dict[bytes, bytes]:
        ...

    async def get_all_data_with_max_change_id(self) -> Tuple[int, Dict[bytes, bytes]]:
        ...

    async def get_collection_data(self, collection: str) -> Dict[int, bytes]:
        ...

    async def get_element_data(self, element_id: str) -> Optional[bytes]:
        ...

    async def add_changed_elements(
        self, changed_elements: List[str], deleted_element_ids: List[str]
    ) -> int:
        ...

    async def get_current_change_id(self) -> int:
        ...

    async def get_lowest_change_id(self) -> int:
        ...

    async def get_schema_version(self) -> Optional[SchemaVersion]:
        ...

    async def set_schema_version(self, schema_version: SchemaVersion) -> None:
        ...


def ensure_cache_wrapper() -> Callable[[Callable[..., Any]], Callable[..., Any]]:
    """
    Wraps a cache function to ensure, that the cache is filled.
    When the function raises a CacheReset-Error the cache will be ensured (call
    to `ensure_cache`) and the method will be recalled. This is done, until the
    operation was successful.
    """

    def wrapper(func: Callable[..., Any]) -> Callable[..., Any]:
        @functools.wraps(func)
        async def wrapped(
            cache_provider: ElementCacheProvider, *args: Any, **kwargs: Any
        ) -> Any:
            success = False
            while not success:
                try:
                    result = await func(cache_provider, *args, **kwargs)
                    success = True
                except CacheReset:
                    logger.warn(
                        f"Redis was flushed before method '{func.__name__}'. Ensures cache now."
                    )
                    await cache_provider.ensure_cache()
            return result

        return wrapped

    return wrapper


class RedisCacheProvider:
    """
    Cache provider that loads and saves the data to redis.
    """

    full_data_cache_key: str = "full_data"
    change_id_cache_key: str = "change_id"
    schema_cache_key: str = "schema"
    cache_ready_key: str = "cache_ready"

    # All lua-scripts used by this provider. Every entry is a Tuple (str, bool) with the
    # script and an ensure_cache-indicator. If the indicator is True, a short ensure_cache-script
    # will be prepended to the script which raises a CacheReset, if the full data cache is empty.
    # This requires the full_data_cache_key to be the first key given in `keys`!
    # All scripts are dedented and hashed for faster execution. Convention: The keys of this
    # member are the methods that needs these scripts.
    scripts = {
        "clear_cache": (
            "return redis.call('del', 'fake_key', unpack(redis.call('keys', ARGV[1])))",
            False,
        ),
        "get_all_data": ("return redis.call('hgetall', KEYS[1])", True),
        "get_all_data_with_max_change_id": (
            """
            local tmp = redis.call('zrevrangebyscore', KEYS[2], '+inf', '-inf', 'WITHSCORES', 'LIMIT', 0, 1)
            local max_change_id
            if next(tmp) == nil then
                -- The key does not exist
                return redis.error_reply("cache_reset")
            else
                max_change_id = tmp[2]
            end

            local all_data = redis.call('hgetall', KEYS[1])
            table.insert(all_data, 'max_change_id')
            table.insert(all_data, max_change_id)
            return all_data
            """,
            True,
        ),
        "get_collection_data": (
            """
            local cursor = 0
            local collection = {}
            repeat
                local result = redis.call('HSCAN', KEYS[1], cursor, 'MATCH', ARGV[1])
                cursor = tonumber(result[1])
                for _, v in pairs(result[2]) do
                    table.insert(collection, v)
                end
            until cursor == 0
            return collection
            """,
            True,
        ),
        "get_element_data": ("return redis.call('hget', KEYS[1], ARGV[1])", True),
        "add_changed_elements": (
            # KEYS[1]: full data cache key
            # KEYS[2]: change id cache key
            # ARGV[1]: amount changed elements
            # ARGV[2]: amount deleted elements
            # ARGV[3..(ARGV[1]+2)]: changed_elements (element_id, element, element_id, element, ...)
            # ARGV[(3+ARGV[1])..(ARGV[1]+ARGV[2]+2)]: deleted_elements (element_id, element_id, ...)
            """
            -- Generate a new change_id
            local tmp = redis.call('zrevrangebyscore', KEYS[2], '+inf', '-inf', 'WITHSCORES', 'LIMIT', 0, 1)
            local change_id
            if next(tmp) == nil then
                -- The key does not exist
                return redis.error_reply("cache_reset")
            else
                change_id = tmp[2] + 1
            end

            local nc = tonumber(ARGV[1])
            local nd = tonumber(ARGV[2])

            local i, max, batch_counter
            local change_id_data -- change_id, element_id, change_id, element_id, ...

            -- Add changed_elements to the cache and sorted set using batches of 1000
            -- values in unpack() (see #5386)
            local elements -- element_id, element, element_id, element, ...
            if (nc > 0) then
                i = 3
                max = 3 + nc
                while (i < max) do
                    change_id_data = {}
                    elements = {}
                    batch_counter = 1
                    while (i < max and batch_counter <= 1000) do
                        change_id_data[batch_counter] = change_id
                        change_id_data[batch_counter + 1] = ARGV[i]
                        elements[batch_counter] = ARGV[i]
                        elements[batch_counter + 1] = ARGV[i + 1]
                        batch_counter = batch_counter + 2
                        i = i + 2
                    end
                    if (#change_id_data > 0) then -- so is #elements > 0
                        redis.call('hmset', KEYS[1], unpack(elements))
                        redis.call('zadd', KEYS[2], unpack(change_id_data))
                    end
                end
            end

            -- Delete deleted_element_ids and add them to sorted set
            local element_ids -- element_id, element_id, ...
            local element_ids_counter
            if (nd > 0) then
                i = 3 + nc
                max = 3 + nc + nd
                while (i < max) do
                    change_id_data = {}
                    element_ids = {}
                    batch_counter = 1
                    element_ids_counter = 1
                    while (i < max and batch_counter <= 1000) do
                        change_id_data[batch_counter] = change_id
                        change_id_data[batch_counter + 1] = ARGV[i]
                        element_ids[element_ids_counter] = ARGV[i]
                        batch_counter = batch_counter + 2
                        element_ids_counter = element_ids_counter + 1
                        i = i + 1
                    end
                    if (#change_id_data > 0) then -- so is #element_ids > 0
                        redis.call('hdel', KEYS[1], unpack(element_ids))
                        redis.call('zadd', KEYS[2], unpack(change_id_data))
                    end
                end
            end
            return change_id
            """,
            True,
        ),
    }

    def __init__(self, ensure_cache: Callable[[], Coroutine[Any, Any, None]]) -> None:
        self._ensure_cache = ensure_cache

        # hash all scripts and remove indentation.
        for key in self.scripts.keys():
            script, add_ensure_cache = self.scripts[key]
            script = dedent(script)
            if add_ensure_cache:
                script = (
                    dedent(
                        """
                        local exist = redis.call('exists', KEYS[1])
                        if (exist == 0) then
                            redis.log(redis.LOG_WARNING, "empty: "..KEYS[1])
                            return redis.error_reply("cache_reset")
                        end
                        """
                    )
                    + script
                )
            self.scripts[key] = (script, add_ensure_cache)
        self._script_hashes = {
            key: hashlib.sha1(script.encode()).hexdigest()
            for key, (script, _) in self.scripts.items()
        }

    async def ensure_cache(self) -> None:
        await self._ensure_cache()

    async def clear_cache(self) -> None:
        """
        Deleted all cache entries created with this element cache.
        """
        await self.eval("clear_cache", keys=[], args=["*"])

    async def reset_full_cache(
        self, data: Dict[str, str], default_change_id: int
    ) -> None:
        """
        Deletes the full_data_cache and write new data in it. Clears the change id key.
        """
        async with get_connection() as redis:
            tr = redis.multi_exec()
            tr.delete(self.cache_ready_key)
            tr.delete(self.change_id_cache_key)
            tr.delete(self.full_data_cache_key)
            tr.hmset_dict(self.full_data_cache_key, data)
            tr.zadd(
                self.change_id_cache_key, default_change_id, "_config:lowest_change_id"
            )
            await tr.execute()

    async def add_to_full_data(self, data: Dict[str, str]) -> None:
        async with get_connection() as redis:
            await redis.hmset_dict(self.full_data_cache_key, data)

    async def data_exists(self) -> bool:
        """
        Returns True, when there is data in the cache.
        """
        async with get_connection(read_only=True) as redis:
            return (await redis.get(self.cache_ready_key)) is not None
            # return await redis.exists(self.full_data_cache_key) and bool(
            #    await redis.zrangebyscore(
            #        self.change_id_cache_key, withscores=True, count=1, offset=0
            #    )
            # )

    async def set_cache_ready(self) -> None:
        async with get_connection(read_only=False) as redis:
            await redis.set(self.cache_ready_key, "ok")

    @ensure_cache_wrapper()
    async def get_all_data(self) -> Dict[bytes, bytes]:
        """
        Returns all data from the full_data_cache in a mapping from element_id to the element.
        """
        return await aioredis.util.wait_make_dict(
            self.eval("get_all_data", keys=[self.full_data_cache_key], read_only=True)
        )

    @ensure_cache_wrapper()
    async def get_all_data_with_max_change_id(self) -> Tuple[int, Dict[bytes, bytes]]:
        """
        Returns all data from the full_data_cache in a mapping from element_id to the element and
        the max change id.
        """
        all_data = await aioredis.util.wait_make_dict(
            self.eval(
                "get_all_data_with_max_change_id",
                keys=[self.full_data_cache_key, self.change_id_cache_key],
                read_only=True,
            )
        )
        max_change_id = int(all_data.pop(b"max_change_id"))
        return max_change_id, all_data

    @ensure_cache_wrapper()
    async def get_collection_data(self, collection: str) -> Dict[int, bytes]:
        """
        Returns all elements for a collection from the cache. The data is mapped
        from element_id to the element.
        """
        response = await self.eval(
            "get_collection_data",
            [self.full_data_cache_key],
            [f"{collection}:*"],
            read_only=True,
        )

        collection_data = {}
        for i in range(0, len(response), 2):
            _, id = split_element_id(response[i])
            collection_data[id] = response[i + 1]

        return collection_data

    @ensure_cache_wrapper()
    async def get_element_data(self, element_id: str) -> Optional[bytes]:
        """
        Returns one element from the cache. Returns None, when the element does not exist.
        """
        return await self.eval(
            "get_element_data", [self.full_data_cache_key], [element_id], read_only=True
        )

    @ensure_cache_wrapper()
    async def add_changed_elements(
        self, changed_elements: List[str], deleted_element_ids: List[str]
    ) -> int:
        """
        Modified the full_data_cache to insert the changed_elements and removes the
        deleted_element_ids (in this order). Generates a new change_id and inserts all
        element_ids (changed and deleted) with the change_id into the change_id_cache.
        The newly generated change_id is returned.
        """
        return int(
            await self.eval(
                "add_changed_elements",
                keys=[self.full_data_cache_key, self.change_id_cache_key],
                args=[
                    len(changed_elements),
                    len(deleted_element_ids),
                    *(changed_elements + deleted_element_ids),
                ],
            )
        )

    @ensure_cache_wrapper()
    async def get_current_change_id(self) -> int:
        """
        Get the highest change_id from redis.
        """
        async with get_connection(read_only=True) as redis:
            value = await redis.zrevrangebyscore(
                self.change_id_cache_key, withscores=True, count=1, offset=0
            )
        # Return the score (second element) of the first (and only) element, if exists.
        if not value:
            raise CacheReset()
        return value[0][1]

    @ensure_cache_wrapper()
    async def get_lowest_change_id(self) -> int:
        """
        Get the lowest change_id from redis.
        """
        async with get_connection(read_only=True) as redis:
            value = await redis.zscore(
                self.change_id_cache_key, "_config:lowest_change_id"
            )
        if not value:
            raise CacheReset()
        return value

    async def get_schema_version(self) -> Optional[SchemaVersion]:
        """ Retrieves the schema version of the cache or None, if not existent """
        async with get_connection(read_only=True) as redis:
            try:
                schema_version = await redis.hgetall(self.schema_cache_key)
            except aioredis.errors.ReplyError:
                await redis.delete(self.schema_cache_key)
                return None
        if not schema_version:
            return None

        return {
            "migration": int(schema_version[b"migration"].decode()),
            "config": int(schema_version[b"config"].decode()),
            "db": schema_version[b"db"].decode(),
        }

    async def set_schema_version(self, schema_version: SchemaVersion) -> None:
        """ Sets the schema version for this cache. """
        async with get_connection() as redis:
            await redis.hmset_dict(self.schema_cache_key, schema_version)

    async def eval(
        self,
        script_name: str,
        keys: List[str] = [],
        args: List[Any] = [],
        read_only: bool = False,
    ) -> Any:
        """
        Runs a lua script in redis. This wrapper around redis.eval tries to make
        usage of redis script cache. First the hash is send to the server and if
        the script is not present there (NOSCRIPT error) the actual script will be
        send.
        If the script uses the ensure_cache-prefix, the first key must be the full_data
        cache key. This is checked here.
        Also this method incudes the custom "CacheReset" error, which will be raised in
        python, if the lua-script returns a "cache_reset" string as an error response.
        """
        hash = self._script_hashes[script_name]
        if self.scripts[script_name][1] and not keys[0] == self.full_data_cache_key:
            raise ImproperlyConfigured(
                "A script with a ensure_cache prefix must have the full_data cache key as its first key"
            )

        async with get_connection(read_only=read_only) as redis:
            try:
                result = await redis.evalsha(hash, keys, args)
            except aioredis.errors.ReplyError as e:
                if str(e).startswith("NOSCRIPT"):
                    result = await self._eval(redis, script_name, keys=keys, args=args)
                elif str(e) == "cache_reset":
                    raise CacheReset()
                else:
                    raise e
            return result

    async def _eval(
        self, redis: Any, script_name: str, keys: List[str] = [], args: List[Any] = []
    ) -> Any:
        """ Do a real eval of the script (no hash used here). Catches "cache_reset". """
        try:
            return await redis.eval(self.scripts[script_name][0], keys, args)
        except aioredis.errors.ReplyError as e:
            if str(e) == "cache_reset":
                raise CacheReset()
            else:
                raise e


class MemoryCacheProvider:
    """
    CacheProvider for the ElementCache that uses only the memory.

    See the RedisCacheProvider for a description of the methods.

    This provider supports only one process. It saves the data into the memory.
    When you use different processes they will use diffrent data.

    For this reason, the ensure_cache is not used and the schema version always
    returns an invalid schema to always buold the cache.
    """

    def __init__(self, ensure_cache: Callable[[], Coroutine[Any, Any, None]]) -> None:
        self.set_data_dicts()

    def set_data_dicts(self) -> None:
        self.ready = False
        self.full_data: Dict[str, str] = {}
        self.change_id_data: Dict[int, Set[str]] = {}
        self.locks: Dict[str, str] = {}
        self.default_change_id: int = -1

    async def ensure_cache(self) -> None:
        pass

    async def clear_cache(self) -> None:
        self.set_data_dicts()
        self.ready = False

    async def reset_full_cache(
        self, data: Dict[str, str], default_change_id: int
    ) -> None:
        self.change_id_data = {}
        self.full_data = data
        self.default_change_id = default_change_id

    async def add_to_full_data(self, data: Dict[str, str]) -> None:
        self.full_data.update(data)

    async def data_exists(self) -> bool:
        return self.ready
        # return bool(self.full_data) and self.default_change_id >= 0

    async def set_cache_ready(self) -> None:
        self.ready = True

    async def get_all_data(self) -> Dict[bytes, bytes]:
        return str_dict_to_bytes(self.full_data)

    async def get_all_data_with_max_change_id(self) -> Tuple[int, Dict[bytes, bytes]]:
        all_data = await self.get_all_data()
        max_change_id = await self.get_current_change_id()
        return max_change_id, all_data

    async def get_collection_data(self, collection: str) -> Dict[int, bytes]:
        out = {}
        query = f"{collection}:"
        for element_id, value in self.full_data.items():
            if element_id.startswith(query):
                _, id = split_element_id(element_id)
                out[id] = value.encode()
        return out

    async def get_element_data(self, element_id: str) -> Optional[bytes]:
        value = self.full_data.get(element_id, None)
        return value.encode() if value is not None else None

    async def add_changed_elements(
        self, changed_elements: List[str], deleted_element_ids: List[str]
    ) -> int:
        change_id = await self.get_current_change_id() + 1

        for i in range(0, len(changed_elements), 2):
            element_id = changed_elements[i]
            self.full_data[element_id] = changed_elements[i + 1]

            if change_id in self.change_id_data:
                self.change_id_data[change_id].add(element_id)
            else:
                self.change_id_data[change_id] = {element_id}

        for element_id in deleted_element_ids:
            try:
                del self.full_data[element_id]
            except KeyError:
                pass
            if change_id in self.change_id_data:
                self.change_id_data[change_id].add(element_id)
            else:
                self.change_id_data[change_id] = {element_id}

        return change_id

    async def get_current_change_id(self) -> int:
        if self.change_id_data:
            return max(self.change_id_data.keys())
        else:
            return await self.get_lowest_change_id()

    async def get_lowest_change_id(self) -> int:
        return self.default_change_id

    async def get_schema_version(self) -> Optional[SchemaVersion]:
        return None

    async def set_schema_version(self, schema_version: SchemaVersion) -> None:
        pass


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
