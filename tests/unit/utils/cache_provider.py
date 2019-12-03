from typing import Any, Callable, Dict, List

from openslides.utils.cache_providers import Cachable, MemoryCacheProvider


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
    personalized_model = False

    def get_collection_string(self) -> str:
        return "app/collection1"

    def get_elements(self) -> List[Dict[str, Any]]:
        return [{"id": 1, "value": "value1"}, {"id": 2, "value": "value2"}]

    async def restrict_elements(
        self, user_id: int, elements: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        return restrict_elements(elements)


class Collection2:
    personalized_model = False

    def get_collection_string(self) -> str:
        return "app/collection2"

    def get_elements(self) -> List[Dict[str, Any]]:
        return [{"id": 1, "key": "value1"}, {"id": 2, "key": "value2"}]

    async def restrict_elements(
        self, user_id: int, elements: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        return restrict_elements(elements)


class PersonalizedCollection:
    personalized_model = True

    def get_collection_string(self) -> str:
        return "app/personalized-collection"

    def get_elements(self) -> List[Dict[str, Any]]:
        return [
            {"id": 1, "key": "value1", "user_id": 1},
            {"id": 2, "key": "value2", "user_id": 2},
        ]

    async def restrict_elements(
        self, user_id: int, elements: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        return [element for element in elements if element["user_id"] == user_id]


def get_cachable_provider(
    cachables: List[Cachable] = [Collection1(), Collection2(), PersonalizedCollection()]
) -> Callable[[], List[Cachable]]:
    """
    Returns a cachable_provider.
    """
    return lambda: cachables


def example_data():
    return {
        "app/collection1": [{"id": 1, "value": "value1"}, {"id": 2, "value": "value2"}],
        "app/collection2": [{"id": 1, "key": "value1"}, {"id": 2, "key": "value2"}],
        "app/personalized-collection": [
            {"id": 1, "key": "value1", "user_id": 1},
            {"id": 2, "key": "value2", "user_id": 2},
        ],
    }


class TTestCacheProvider(MemoryCacheProvider):
    """
    CacheProvider simular to the MemoryCacheProvider with special methods for
    testing.

    Currently just a dummy for future extensions.
    """

    pass
