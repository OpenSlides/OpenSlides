import asyncio
from typing import Any, Callable, Dict, List

from openslides.utils.cache_providers import Cachable, MemmoryCacheProvider


def restrict_elements(elements: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Adds the prefix 'restricted_' to all values except id.
    """
    out = []
    for element in elements:
        restricted_element = {}
        for key, value in element.items():
            if key == "id":
                restricted_element[key] = value
            else:
                restricted_element[key] = f"restricted_{value}"
        out.append(restricted_element)
    return out


class Collection1:
    def get_collection_string(self) -> str:
        return "app/collection1"

    def get_elements(self) -> List[Dict[str, Any]]:
        return [{"id": 1, "value": "value1"}, {"id": 2, "value": "value2"}]

    async def restrict_elements(
        self, user_id: int, elements: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        return restrict_elements(elements)


class Collection2:
    def get_collection_string(self) -> str:
        return "app/collection2"

    def get_elements(self) -> List[Dict[str, Any]]:
        return [{"id": 1, "key": "value1"}, {"id": 2, "key": "value2"}]

    async def restrict_elements(
        self, user_id: int, elements: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        return restrict_elements(elements)


def get_cachable_provider(
    cachables: List[Cachable] = [Collection1(), Collection2()]
) -> Callable[[], List[Cachable]]:
    """
    Returns a cachable_provider.
    """
    return lambda: cachables


def example_data():
    return {
        "app/collection1": [{"id": 1, "value": "value1"}, {"id": 2, "value": "value2"}],
        "app/collection2": [{"id": 1, "key": "value1"}, {"id": 2, "key": "value2"}],
    }


class TTestCacheProvider(MemmoryCacheProvider):
    """
    CacheProvider simular to the MemmoryCacheProvider with special methods for
    testing.
    """

    async def del_lock_after_wait(
        self, lock_name: str, future: asyncio.Future = None
    ) -> None:
        async def set_future() -> None:
            await self.del_lock(lock_name)

        asyncio.ensure_future(set_future())
