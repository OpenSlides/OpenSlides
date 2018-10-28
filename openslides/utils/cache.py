import asyncio
import json
from collections import defaultdict
from datetime import datetime
from time import sleep
from typing import (
    TYPE_CHECKING,
    Any,
    Callable,
    Dict,
    List,
    Optional,
    Tuple,
    Type,
)

from asgiref.sync import async_to_sync, sync_to_async
from django.conf import settings

from .cache_providers import (
    Cachable,
    ElementCacheProvider,
    MemmoryCacheProvider,
    RedisCacheProvider,
    get_all_cachables,
    no_redis_dependency,
)
from .utils import get_element_id, get_user_id, split_element_id


if TYPE_CHECKING:
    # Dummy import Collection for mypy, can be fixed with python 3.7
    from .collection import CollectionElement  # noqa


class ElementCache:
    """
    Cache for the CollectionElements.

    Saves the full_data and if enabled the restricted data.

    There is one redis Hash (simular to python dict) for the full_data and one
    Hash for every user.

    The key of the Hashes is COLLECTIONSTRING:ID where COLLECTIONSTRING is the
    collection_string of a collection and id the id of an element.

    All elements have to be in the cache. If one element is missing, the cache
    is invalid, but this can not be detected. When a plugin with a new
    collection is added to OpenSlides, then the cache has to be rebuild manualy.

    There is an sorted set in redis with the change id as score. The values are
    COLLETIONSTRING:ID for the elements that have been changed with that change
    id. With this key it is possible, to get all elements as full_data or as
    restricted_data that are newer then a specific change id.

    All method of this class are async. You either have to call them with
    await in an async environment or use asgiref.sync.async_to_sync().
    """

    def __init__(
            self,
            redis: str,
            use_restricted_data_cache: bool = False,
            cache_provider_class: Type[ElementCacheProvider] = RedisCacheProvider,
            cachable_provider: Callable[[], List[Cachable]] = get_all_cachables,
            start_time: int = None) -> None:
        """
        Initializes the cache.

        When restricted_data_cache is false, no restricted data is saved.
        """
        self.use_restricted_data_cache = use_restricted_data_cache
        self.cache_provider = cache_provider_class(redis)
        self.cachable_provider = cachable_provider
        self._cachables: Optional[Dict[str, Cachable]] = None

        # Start time is used as first change_id if there is non in redis
        if start_time is None:
            # Use the miliseconds (rounted) since the 2016-02-29.
            start_time = int((datetime.utcnow() - datetime(2016, 2, 29)).total_seconds()) * 1000
        self.start_time = start_time

        # Contains Futures to controll, that only one client updates the restricted_data.
        self.restricted_data_cache_updater: Dict[int, asyncio.Future] = {}

        # Tells if self.ensure_cache was called.
        self.ensured = False

    @property
    def cachables(self) -> Dict[str, Cachable]:
        """
        Returns all Cachables as a dict where the key is the collection_string of the cachable.
        """
        # This method is neccessary to lazy load the cachables
        if self._cachables is None:
            self._cachables = {cachable.get_collection_string(): cachable for cachable in self.cachable_provider()}
        return self._cachables

    def ensure_cache(self, reset: bool = False) -> None:
        """
        Makes sure that the cache exist.

        Builds the cache if not. If reset is True, it will be reset in any case.

        This method is sync, so it can be run when OpenSlides starts.
        """
        cache_exists = async_to_sync(self.cache_provider.data_exists)()

        if reset or not cache_exists:
            lock_name = 'ensure_cache'
            # Set a lock so only one process builds the cache
            if async_to_sync(self.cache_provider.set_lock)(lock_name):
                try:
                    mapping = {}
                    for collection_string, cachable in self.cachables.items():
                        for element in cachable.get_elements():
                            mapping.update(
                                {get_element_id(collection_string, element['id']):
                                 json.dumps(element)})
                    async_to_sync(self.cache_provider.reset_full_cache)(mapping)
                finally:
                    async_to_sync(self.cache_provider.del_lock)(lock_name)
            else:
                while async_to_sync(self.cache_provider.get_lock)(lock_name):
                    sleep(0.01)

        self.ensured = True

    async def change_elements(
            self, elements: Dict[str, Optional[Dict[str, Any]]]) -> int:
        """
        Changes elements in the cache.

        elements is a list of the changed elements as dict. When the value is None,
        it is interpreded as deleted. The key has to be an element_id.

        Returns the new generated change_id.
        """
        deleted_elements = []
        changed_elements = []
        for element_id, data in elements.items():
            if data:
                # The arguments for redis.hset is pairs of key value
                changed_elements.append(element_id)
                changed_elements.append(json.dumps(data))
            else:
                deleted_elements.append(element_id)

        if changed_elements:
            await self.cache_provider.add_elements(changed_elements)
        if deleted_elements:
            await self.cache_provider.del_elements(deleted_elements)

        return await self.cache_provider.add_changed_elements(self.start_time + 1, elements.keys())

    async def get_all_full_data(self) -> Dict[str, List[Dict[str, Any]]]:
        """
        Returns all full_data. If it does not exist, it is created.

        The returned value is a dict where the key is the collection_string and
        the value is a list of data.
        """
        out: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        full_data = await self.cache_provider.get_all_data()
        for element_id, data in full_data.items():
            collection_string, __ = split_element_id(element_id)
            out[collection_string].append(json.loads(data.decode()))
        return dict(out)

    async def get_full_data(
            self, change_id: int = 0, max_change_id: int = -1) -> Tuple[Dict[str, List[Dict[str, Any]]], List[str]]:
        """
        Returns all full_data since change_id until max_change_id (including).
        max_change_id -1 means the highest change_id.

        Returns two values inside a tuple. The first value is a dict where the
        key is the collection_string and the value is a list of data. The second
        is a list of element_ids with deleted elements.

        Only returns elements with the change_id or newer. When change_id is 0,
        all elements are returned.

        Raises a RuntimeError when the lowest change_id in redis is higher then
        the requested change_id. In this case the method has to be rerun with
        change_id=0. This is importend because there could be deleted elements
        that the cache does not know about.
        """
        if change_id == 0:
            return (await self.get_all_full_data(), [])

        # This raises a Runtime Exception, if there is no change_id
        lowest_change_id = await self.get_lowest_change_id()

        if change_id < lowest_change_id:
            # When change_id is lower then the lowest change_id in redis, we can
            # not inform the user about deleted elements.
            raise RuntimeError(
                "change_id {} is lower then the lowest change_id in redis {}. "
                "Catch this exception and rerun the method with change_id=0."
                .format(change_id, lowest_change_id))

        raw_changed_elements, deleted_elements = await self.cache_provider.get_data_since(change_id, max_change_id=max_change_id)
        return (
            {collection_string: [json.loads(value.decode()) for value in value_list]
             for collection_string, value_list in raw_changed_elements.items()},
            deleted_elements)

    async def get_element_full_data(self, collection_string: str, id: int) -> Optional[Dict[str, Any]]:
        """
        Returns one element as full data.

        If the cache is empty, it is created.

        Returns None if the element does not exist.
        """
        element = await self.cache_provider.get_element(get_element_id(collection_string, id))

        if element is None:
            return None
        return json.loads(element.decode())

    async def exists_restricted_data(self, user: Optional['CollectionElement']) -> bool:
        """
        Returns True, if the restricted_data exists for the user.
        """
        if not self.use_restricted_data_cache:
            return False

        return await self.cache_provider.data_exists(get_user_id(user))

    async def del_user(self, user: Optional['CollectionElement']) -> None:
        """
        Removes one user from the resticted_data_cache.
        """
        await self.cache_provider.del_restricted_data(get_user_id(user))

    async def update_restricted_data(
            self, user: Optional['CollectionElement']) -> None:
        """
        Updates the restricted data for an user from the full_data_cache.
        """
        # TODO: When elements are changed at the same time then this method run
        #       this could make the cache invalid.
        #       This could be fixed when get_full_data would be used with a
        #       max change_id.
        if not self.use_restricted_data_cache:
            # If the restricted_data_cache is not used, there is nothing to do
            return

        # Try to write a special key.
        # If this succeeds, there is noone else currently updating the cache.
        # TODO: Make a timeout. Else this could block forever
        lock_name = "restricted_data_{}".format(get_user_id(user))
        if await self.cache_provider.set_lock(lock_name):
            future: asyncio.Future = asyncio.Future()
            self.restricted_data_cache_updater[get_user_id(user)] = future
            # Get change_id for this user
            value = await self.cache_provider.get_change_id_user(get_user_id(user))
            # If the change id is not in the cache yet, use -1 to get all data since 0
            user_change_id = int(value) if value else -1
            change_id = await self.get_current_change_id()
            if change_id > user_change_id:
                try:
                    full_data_elements, deleted_elements = await self.get_full_data(user_change_id + 1)
                except RuntimeError:
                    # The user_change_id is lower then the lowest change_id in the cache.
                    # The whole restricted_data for that user has to be recreated.
                    full_data_elements = await self.get_all_full_data()
                    await self.cache_provider.del_restricted_data(get_user_id(user))
                else:
                    # Remove deleted elements
                    if deleted_elements:
                        await self.cache_provider.del_elements(deleted_elements, get_user_id(user))

                mapping = {}
                for collection_string, full_data in full_data_elements.items():
                    restricter = self.cachables[collection_string].restrict_elements
                    elements = await sync_to_async(restricter)(user, full_data)
                    for element in elements:
                        mapping.update(
                            {get_element_id(collection_string, element['id']):
                             json.dumps(element)})
                mapping['_config:change_id'] = str(change_id)
                await self.cache_provider.update_restricted_data(get_user_id(user), mapping)
            # Unset the lock
            await self.cache_provider.del_lock(lock_name)
            future.set_result(1)
        else:
            # Wait until the update if finshed
            if get_user_id(user) in self.restricted_data_cache_updater:
                # The active worker is on the same asgi server, we can use the future
                await self.restricted_data_cache_updater[get_user_id(user)]
            else:
                while await self.cache_provider.get_lock(lock_name):
                    await asyncio.sleep(0.01)

    async def get_all_restricted_data(self, user: Optional['CollectionElement']) -> Dict[str, List[Dict[str, Any]]]:
        """
        Like get_all_full_data but with restricted_data for an user.
        """
        if not self.use_restricted_data_cache:
            all_restricted_data = {}
            for collection_string, full_data in (await self.get_all_full_data()).items():
                restricter = self.cachables[collection_string].restrict_elements
                elements = await sync_to_async(restricter)(user, full_data)
                all_restricted_data[collection_string] = elements
            return all_restricted_data

        await self.update_restricted_data(user)

        out: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        restricted_data = await self.cache_provider.get_all_data(get_user_id(user))
        for element_id, data in restricted_data.items():
            if element_id.decode().startswith('_config'):
                continue
            collection_string, __ = split_element_id(element_id)
            out[collection_string].append(json.loads(data.decode()))
        return dict(out)

    async def get_restricted_data(
            self,
            user: Optional['CollectionElement'],
            change_id: int = 0,
            max_change_id: int = -1) -> Tuple[Dict[str, List[Dict[str, Any]]], List[str]]:
        """
        Like get_full_data but with restricted_data for an user.
        """
        if change_id == 0:
            # Return all data
            return (await self.get_all_restricted_data(user), [])

        if not self.use_restricted_data_cache:
            changed_elements, deleted_elements = await self.get_full_data(change_id, max_change_id)
            restricted_data = {}
            for collection_string, full_data in changed_elements.items():
                restricter = self.cachables[collection_string].restrict_elements
                elements = await sync_to_async(restricter)(user, full_data)
                restricted_data[collection_string] = elements
            return restricted_data, deleted_elements

        lowest_change_id = await self.get_lowest_change_id()
        if change_id < lowest_change_id:
            # When change_id is lower then the lowest change_id in redis, we can
            # not inform the user about deleted elements.
            raise RuntimeError(
                "change_id {} is lower then the lowest change_id in redis {}. "
                "Catch this exception and rerun the method with change_id=0."
                .format(change_id, lowest_change_id))

        # If another coroutine or another daphne server also updates the restricted
        # data, this waits until it is done.
        await self.update_restricted_data(user)

        raw_changed_elements, deleted_elements = await self.cache_provider.get_data_since(change_id, get_user_id(user), max_change_id)
        return (
            {collection_string: [json.loads(value.decode()) for value in value_list]
             for collection_string, value_list in raw_changed_elements.items()},
            deleted_elements)

    async def get_current_change_id(self) -> int:
        """
        Returns the current change id.

        Returns start_time if there is no change id yet.
        """
        value = await self.cache_provider.get_current_change_id()
        if not value:
            return self.start_time
        # Return the score (second element) of the first (and only) element
        return value[0][1]

    async def get_lowest_change_id(self) -> int:
        """
        Returns the lowest change id.

        Raises a RuntimeError if there is no change_id.
        """
        value = await self.cache_provider.get_lowest_change_id()
        if not value:
            raise RuntimeError('There is no known change_id.')
        # Return the score (second element) of the first (and only) element
        return value


def load_element_cache(redis_addr: str = '', restricted_data: bool = True) -> ElementCache:
    """
    Generates an element cache instance.
    """
    if not redis_addr:
        return ElementCache(redis='', cache_provider_class=MemmoryCacheProvider)

    if no_redis_dependency:
        raise ImportError("OpenSlides is configured to use redis as cache backend, but aioredis is not installed.")
    return ElementCache(redis=redis_addr, use_restricted_data_cache=restricted_data)


# Set the element_cache
redis_address = getattr(settings, 'REDIS_ADDRESS', '')
use_restricted_data = getattr(settings, 'RESTRICTED_DATA_CACHE', True)
element_cache = load_element_cache(redis_addr=redis_address, restricted_data=use_restricted_data)
