import json
from collections import defaultdict
from datetime import datetime
from time import sleep
from typing import Any, Callable, Dict, List, Optional, Type

from asgiref.sync import async_to_sync, sync_to_async
from django.apps import apps

from . import logging
from .cache_providers import (
    Cachable,
    ElementCacheProvider,
    MemoryCacheProvider,
    RedisCacheProvider,
)
from .locking import locking
from .redis import use_redis
from .schema_version import SchemaVersion, schema_version_handler
from .utils import get_element_id, split_element_id


logger = logging.getLogger(__name__)


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
    collection of a collection and id the id of an element.

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
        Returns all cachables as a dict where the key is the collection of the cachable.
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
        if await locking.set(lock_name):
            try:
                await self._build_cache(
                    default_change_id=default_change_id, schema_version=schema_version
                )
            finally:
                await locking.delete(lock_name)
        else:
            logger.info("Wait for another process to build up the cache...")
            while await locking.get(lock_name):
                sleep(0.01)
            logger.info("Cache is ready (built by another process).")

    async def _build_cache(
        self,
        default_change_id: Optional[int] = None,
        schema_version: Optional[SchemaVersion] = None,
    ) -> None:
        logger.info("Building config data and resetting cache...")
        config_mapping = await sync_to_async(
            self._build_cache_get_elementid_model_mapping
        )(config_only=True)
        change_id = self._build_cache_get_change_id(default_change_id)
        await self.cache_provider.reset_full_cache(config_mapping, change_id)
        if schema_version:
            await self.cache_provider.set_schema_version(schema_version)
        logger.info("Done building and resetting.")

        logger.info("Building up the cache data...")
        mapping = await sync_to_async(self._build_cache_get_elementid_model_mapping)()
        logger.info("Done building the cache data.")
        logger.info("Saving cache data into the cache...")
        await self.cache_provider.add_to_full_data(mapping)
        logger.info("Done saving the cache data.")
        await self.cache_provider.set_cache_ready()
        logger.info("Done: Cache is ready now.")

    def _build_cache_get_elementid_model_mapping(
        self, config_only: bool = False
    ) -> Dict[str, str]:
        """
        Do NOT call this in an asynchronous context!
        This accesses the django's model system which requires a synchronous context.

        config_only=True only includes the config collection
        config_only=False *excludes* the config collection
        """
        mapping = {}
        config_collection = "core/config"
        for collection, cachable in self.cachables.items():
            if (config_only and collection != config_collection) or (
                not config_only and collection == config_collection
            ):
                continue
            for element in cachable.get_elements():
                mapping.update(
                    {get_element_id(collection, element["id"]): json.dumps(element)}
                )
        return mapping

    def _build_cache_get_change_id(
        self, default_change_id: Optional[int] = None
    ) -> int:
        if default_change_id is None:
            if self.default_change_id is not None:
                change_id = self.default_change_id
            else:
                # Use the miliseconds (rounded) since the 2016-02-29.
                change_id = (
                    int((datetime.utcnow() - datetime(2016, 2, 29)).total_seconds())
                    * 1000
                )
        else:
            change_id = default_change_id
        return change_id

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

    async def get_all_data_list(self) -> Dict[str, List[Dict[str, Any]]]:
        """
        Returns all data with a list per collection:
        {
            <collection>: [<element>, <element>, ...]
        }
        If the user id is given the data will be restricted for this user.
        """
        all_data = await self.cache_provider.get_all_data()
        return await self.format_all_data(all_data)

    async def format_all_data(
        self, all_data_bytes: Dict[bytes, bytes]
    ) -> Dict[str, List[Dict[str, Any]]]:
        all_data: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        for element_id, data in all_data_bytes.items():
            collection, _ = split_element_id(element_id)
            element = json.loads(data.decode())
            all_data[collection].append(element)

        return dict(all_data)

    async def get_collection_data(self, collection: str) -> Dict[int, Dict[str, Any]]:
        """
        Returns the data for one collection as dict: {id: <element>}
        """
        encoded_collection_data = await self.cache_provider.get_collection_data(
            collection
        )
        collection_data = {}
        for id in encoded_collection_data.keys():
            collection_data[id] = json.loads(encoded_collection_data[id].decode())
        return collection_data

    async def get_element_data(
        self, collection: str, id: int
    ) -> Optional[Dict[str, Any]]:
        """
        Returns one element or None, if the element does not exist.
        If the user id is given the data will be restricted for this user.
        """
        encoded_element = await self.cache_provider.get_element_data(
            get_element_id(collection, id)
        )

        if encoded_element is None:
            return None
        return json.loads(encoded_element.decode())  # type: ignore

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
