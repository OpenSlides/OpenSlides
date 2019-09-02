import json
from collections import defaultdict
from datetime import datetime
from time import sleep
from typing import Any, Callable, Dict, List, Optional, Tuple, Type

from asgiref.sync import async_to_sync
from django.apps import apps

from . import logging
from .cache_providers import (
    Cachable,
    ElementCacheProvider,
    MemoryCacheProvider,
    RedisCacheProvider,
)
from .redis import use_redis
from .schema_version import SchemaVersion, schema_version_handler
from .utils import get_element_id, split_element_id


logger = logging.getLogger(__name__)


class ChangeIdTooLowError(Exception):
    pass


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


class ElementCache:
    """
    Cache for the elements.

    Saves the full_data

    There is one redis Hash (simular to python dict) for the full_data

    The key of the Hashes is COLLECTIONSTRING:ID where COLLECTIONSTRING is the
    collection_string of a collection and id the id of an element.

    There is an sorted set in redis with the change id as score. The values are
    COLLETIONSTRING:ID for the elements that have been changed with that change
    id. With this key it is possible, to get all elements as full_data
    that are newer then a specific change id.

    All method of this class are async. You either have to call them with
    await in an async environment or use asgiref.sync.async_to_sync().
    """

    def __init__(
        self,
        cache_provider_class: Type[ElementCacheProvider] = RedisCacheProvider,
        cachable_provider: Callable[[], List[Cachable]] = get_all_cachables,
        default_change_id: Optional[int] = None,
    ) -> None:
        """
        Initializes the cache.
        """
        self.cache_provider = cache_provider_class(self.async_ensure_cache)
        self.cachable_provider = cachable_provider
        self._cachables: Optional[Dict[str, Cachable]] = None
        self.default_change_id: Optional[int] = default_change_id

    @property
    def cachables(self) -> Dict[str, Cachable]:
        """
        Returns all cachables as a dict where the key is the collection_string of the cachable.
        """
        # This method is neccessary to lazy load the cachables
        if self._cachables is None:
            self._cachables = {
                cachable.get_collection_string(): cachable
                for cachable in self.cachable_provider()
            }
        return self._cachables

    def ensure_cache(
        self, reset: bool = False, default_change_id: Optional[int] = None
    ) -> None:
        """
        Ensures the existance of the cache; see async_ensure_cache for more info.
        """
        async_to_sync(self.async_ensure_cache)(reset, default_change_id)

    async def async_ensure_cache(
        self, reset: bool = False, default_change_id: Optional[int] = None
    ) -> None:
        """
        Makes sure that the cache exist. Builds the cache if not or reset is given as True.
        """
        cache_exists = await self.cache_provider.data_exists()

        if reset or not cache_exists:
            await self.build_cache(default_change_id)

    def ensure_schema_version(self) -> None:
        async_to_sync(self.async_ensure_schema_version)()

    async def async_ensure_schema_version(self) -> None:
        cache_schema_version = await self.cache_provider.get_schema_version()
        schema_changed = not schema_version_handler.compare(cache_schema_version)
        schema_version_handler.log_current()

        cache_exists = await self.cache_provider.data_exists()
        if schema_changed or not cache_exists:
            await self.build_cache(schema_version=schema_version_handler.get())

    async def build_cache(
        self,
        default_change_id: Optional[int] = None,
        schema_version: Optional[SchemaVersion] = None,
    ) -> None:
        lock_name = "build_cache"
        # Set a lock so only one process builds the cache
        if await self.cache_provider.set_lock(lock_name):
            logger.info("Building up the cache data...")
            try:
                mapping = {}
                for collection_string, cachable in self.cachables.items():
                    for element in cachable.get_elements():
                        mapping.update(
                            {
                                get_element_id(
                                    collection_string, element["id"]
                                ): json.dumps(element)
                            }
                        )
                logger.info("Done building the cache data.")
                logger.info("Saving cache data into the cache...")
                if default_change_id is None:
                    if self.default_change_id is not None:
                        default_change_id = self.default_change_id
                    else:
                        # Use the miliseconds (rounded) since the 2016-02-29.
                        default_change_id = int(
                            (datetime.utcnow() - datetime(2016, 2, 29)).total_seconds()
                        )
                        default_change_id *= 1000
                await self.cache_provider.reset_full_cache(mapping, default_change_id)
                if schema_version:
                    await self.cache_provider.set_schema_version(schema_version)
                logger.info("Done saving the cache data.")
            finally:
                await self.cache_provider.del_lock(lock_name)
        else:
            logger.info("Wait for another process to build up the cache...")
            while await self.cache_provider.get_lock(lock_name):
                sleep(0.01)
            logger.info("Cache is ready (built by another process).")

    async def change_elements(
        self, elements: Dict[str, Optional[Dict[str, Any]]]
    ) -> int:
        """
        Changes elements in the cache.

        elements is a dict with element_id <-> changed element. When the value is None,
        it is interpreded as deleted.

        Returns the new generated change_id.
        """
        # Split elements into changed and deleted.
        deleted_elements = []
        changed_elements = []
        for element_id, data in elements.items():
            if data:
                # The arguments for redis.hset is pairs of key value
                changed_elements.append(element_id)
                changed_elements.append(json.dumps(data))
            else:
                deleted_elements.append(element_id)

        return await self.cache_provider.add_changed_elements(
            changed_elements, deleted_elements
        )

    async def get_all_data_list(
        self, user_id: Optional[int] = None
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        Returns all data with a list per collection:
        {
            <collection>: [<element>, <element>, ...]
        }
        If the user id is given the data will be restricted for this user.
        """
        all_data: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        for element_id, data in (await self.cache_provider.get_all_data()).items():
            collection_string, _ = split_element_id(element_id)
            all_data[collection_string].append(json.loads(data.decode()))

        if user_id is not None:
            for collection_string in all_data.keys():
                restricter = self.cachables[collection_string].restrict_elements
                all_data[collection_string] = await restricter(
                    user_id, all_data[collection_string]
                )
        return dict(all_data)

    async def get_all_data_dict(self) -> Dict[str, Dict[int, Dict[str, Any]]]:
        """
        Returns all data with a dict (id <-> element) per collection:
        {
            <collection>: {
                <id>: <element>
            }
        }
        """
        all_data: Dict[str, Dict[int, Dict[str, Any]]] = defaultdict(dict)
        for element_id, data in (await self.cache_provider.get_all_data()).items():
            collection_string, id = split_element_id(element_id)
            all_data[collection_string][id] = json.loads(data.decode())
        return dict(all_data)

    async def get_collection_data(
        self, collection_string: str
    ) -> Dict[int, Dict[str, Any]]:
        """
        Returns the data for one collection as dict: {id: <element>}
        """
        encoded_collection_data = await self.cache_provider.get_collection_data(
            collection_string
        )
        collection_data = {}
        for id in encoded_collection_data.keys():
            collection_data[id] = json.loads(encoded_collection_data[id].decode())
        return collection_data

    async def get_element_data(
        self, collection_string: str, id: int, user_id: Optional[int] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Returns one element or None, if the element does not exist.
        If the user id is given the data will be restricted for this user.
        """
        encoded_element = await self.cache_provider.get_element_data(
            get_element_id(collection_string, id)
        )

        if encoded_element is None:
            return None
        element = json.loads(encoded_element.decode())  # type: ignore

        if user_id is not None:
            restricter = self.cachables[collection_string].restrict_elements
            restricted_elements = await restricter(user_id, [element])
            element = restricted_elements[0] if restricted_elements else None
        return element

    async def get_data_since(
        self, user_id: Optional[int] = None, change_id: int = 0, max_change_id: int = -1
    ) -> Tuple[Dict[str, List[Dict[str, Any]]], List[str]]:
        """
        Returns all data since change_id until max_change_id (included).
        max_change_id -1 means the highest change_id. If the user id is given the
        data will be restricted for this user.

        Returns two values inside a tuple. The first value is a dict where the
        key is the collection_string and the value is a list of data. The second
        is a list of element_ids with deleted elements.

        Only returns elements with the change_id or newer. When change_id is 0,
        all elements are returned.

        Raises a ChangeIdTooLowError when the lowest change_id in redis is higher then
        the requested change_id. In this case the method has to be rerun with
        change_id=0. This is importend because there could be deleted elements
        that the cache does not know about.
        """
        if change_id == 0:
            return (await self.get_all_data_list(user_id), [])

        # This raises a Runtime Exception, if there is no change_id
        lowest_change_id = await self.get_lowest_change_id()

        if change_id < lowest_change_id:
            # When change_id is lower then the lowest change_id in redis, we can
            # not inform the user about deleted elements.
            raise ChangeIdTooLowError(
                f"change_id {change_id} is lower then the lowest change_id in redis {lowest_change_id}."
            )

        raw_changed_elements, deleted_elements = await self.cache_provider.get_data_since(
            change_id, max_change_id=max_change_id
        )
        changed_elements = {
            collection_string: [json.loads(value.decode()) for value in value_list]
            for collection_string, value_list in raw_changed_elements.items()
        }

        if user_id is not None:
            # the list(...) is important, because `changed_elements` will be
            # altered during iteration and restricting data
            for collection_string, elements in list(changed_elements.items()):
                cacheable = self.cachables[collection_string]
                restricted_elements = await cacheable.restrict_elements(
                    user_id, elements
                )

                # If the model is personalized, it must not be deleted for other users
                if not cacheable.personalized_model:
                    # Add removed objects (through restricter) to deleted elements.
                    element_ids = set([element["id"] for element in elements])
                    restricted_element_ids = set(
                        [element["id"] for element in restricted_elements]
                    )
                    for id in element_ids - restricted_element_ids:
                        deleted_elements.append(get_element_id(collection_string, id))

                if not restricted_elements:
                    del changed_elements[collection_string]
                else:
                    changed_elements[collection_string] = restricted_elements

        return (changed_elements, deleted_elements)

    async def get_current_change_id(self) -> int:
        """
        Returns the current change id.

        Returns default_change_id if there is no change id yet.
        """
        return await self.cache_provider.get_current_change_id()

    async def get_lowest_change_id(self) -> int:
        """
        Returns the lowest change id.
        """
        return await self.cache_provider.get_lowest_change_id()


def load_element_cache() -> ElementCache:
    """
    Generates an element cache instance.
    """
    if use_redis:
        cache_provider_class: Type[ElementCacheProvider] = RedisCacheProvider
    else:
        cache_provider_class = MemoryCacheProvider

    return ElementCache(cache_provider_class=cache_provider_class)


# Set the element_cache
element_cache = load_element_cache()
