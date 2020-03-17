from typing import Any, Callable, Coroutine, Dict, List, Set

from asgiref.sync import async_to_sync

from .auth import async_anonymous_is_enabled, async_has_perm, user_to_user_id
from .cache import element_cache


class BaseAccessPermissions:
    """
    Base access permissions container.

    Every app which has autoupdate models has to create classes subclassing
    from this base class for every autoupdate root model.
    """

    base_permission = ""
    """
    Set to a permission the user needs to see the element.

    If this string is empty, all users can see it.
    """

    def check_permissions(self, user_id: int) -> bool:
        """
        Returns True if the user has read access to model instances.
        """
        # Convert user to right type
        # TODO: Remove this and make sure, that user has always the right type
        user_id = user_to_user_id(user_id)
        return async_to_sync(self.async_check_permissions)(user_id)

    async def async_check_permissions(self, user_id: int) -> bool:
        """
        Returns True if the user has read access to model instances.
        """
        if self.base_permission:
            return await async_has_perm(user_id, self.base_permission)
        else:
            return bool(user_id) or await async_anonymous_is_enabled()

    async def get_restricted_data(
        self, full_data: List[Dict[str, Any]], user_id: int
    ) -> List[Dict[str, Any]]:
        """
        Returns the restricted serialized data for the instance prepared
        for the user.

        The argument full_data has to be a list of full_data dicts. The type of
        the return is the same. Returns an empty list if the user has no read
        access. Returns reduced data if the user has limited access. Default:
        Returns full data if the user has read access to model instances.
        """
        return full_data if await self.async_check_permissions(user_id) else []


class RequiredUsers:
    """
    Helper class to find all users that are required by another element.
    """

    callables: Dict[str, Callable[[Dict[str, Any]], Coroutine[Any, Any, Set[int]]]] = {}

    def get_collection_strings(self) -> Set[str]:
        """
        Returns all collection strings for elements that could have required users.
        """
        return set(self.callables.keys())

    def add_collection_string(
        self,
        collection_string: str,
        callable: Callable[[Dict[str, Any]], Coroutine[Any, Any, Set[int]]],
    ) -> None:
        """
        Add a callable for a collection_string to get the required users of the
        elements.
        """
        self.callables[collection_string] = callable

    async def get_required_users(self, collection_strings: Set[str]) -> Set[int]:
        """
        Returns the user ids that are required by other elements.

        Returns only user ids required by elements with a collection_string
        in the argument collection_strings.
        """
        user_ids: Set[int] = set()

        for collection_string in collection_strings:
            collection_data = await element_cache.get_collection_data(collection_string)
            # Get the callable for the collection_string
            get_user_ids = self.callables.get(collection_string)
            if not (get_user_ids and collection_data):
                # if the collection_string is unknown or it has no data, do nothing
                continue

            for element in collection_data.values():
                user_ids.update(await get_user_ids(element))

        return user_ids


required_user = RequiredUsers()
