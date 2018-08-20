import asyncio  # noqa
from typing import Any, Callable, Dict, List, Optional

from openslides.utils.cache_providers import Cachable, MemmoryCacheProvider
from openslides.utils.collection import CollectionElement  # noqa


def restrict_elements(
        user: Optional['CollectionElement'],
        elements: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Adds the prefix 'restricted_' to all values except id.
    """
    out = []
    for element in elements:
        restricted_element = {}
        for key, value in element.items():
            if key == 'id':
                restricted_element[key] = value
            else:
                restricted_element[key] = 'restricted_{}'.format(value)
        out.append(restricted_element)
    return out


class Collection1(Cachable):
    def get_collection_string(self) -> str:
        return 'app/collection1'

    def get_elements(self) -> List[Dict[str, Any]]:
        return [
            {'id': 1, 'value': 'value1'},
            {'id': 2, 'value': 'value2'}]

    def restrict_elements(self, user: Optional['CollectionElement'], elements: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        return restrict_elements(user, elements)


class Collection2(Cachable):
    def get_collection_string(self) -> str:
        return 'app/collection2'

    def get_elements(self) -> List[Dict[str, Any]]:
        return [
            {'id': 1, 'key': 'value1'},
            {'id': 2, 'key': 'value2'}]

    def restrict_elements(self, user: Optional['CollectionElement'], elements: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        return restrict_elements(user, elements)


def get_cachable_provider(cachables: List[Cachable] = [Collection1(), Collection2()]) -> Callable[[], List[Cachable]]:
    """
    Returns a cachable_provider.
    """
    return lambda: cachables


def example_data():
    return {
        'app/collection1': [
            {'id': 1, 'value': 'value1'},
            {'id': 2, 'value': 'value2'}],
        'app/collection2': [
            {'id': 1, 'key': 'value1'},
            {'id': 2, 'key': 'value2'}]}


class TTestCacheProvider(MemmoryCacheProvider):
    """
    CacheProvider simular to the MemmoryCacheProvider with special methods for
    testing.
    """

    async def del_lock_restricted_data_after_wait(self, user_id: int, future: asyncio.Future = None) -> None:
        if future is None:
            asyncio.ensure_future(self.del_lock_restricted_data(user_id))
        else:
            async def set_future() -> None:
                await self.del_lock_restricted_data(user_id)
                future.set_result(1)  # type: ignore
            asyncio.ensure_future(set_future())
