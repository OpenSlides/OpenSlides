from typing import Any, Callable, Dict, List, Set

from asgiref.sync import async_to_sync
from django.db.models import Model
from rest_framework.serializers import Serializer

from .auth import async_anonymous_is_enabled, async_has_perm, user_to_user_id
from .cache import element_cache


class BaseAccessPermissions:
    """
    Base access permissions container.

    Every app which has autoupdate models has to create classes subclassing
    from this base class for every autoupdate root model.
    """

    base_permission = ''
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

    def get_serializer_class(self, user_id: int = 0) -> Serializer:
        """
        Returns different serializer classes according to users permissions.

        This should return the serializer for full data access if user is
        None. See get_full_data().
        """
        # TODO: Rewrite me by using an serializer_class attribute and removing
        # the user_id argument.
        raise NotImplementedError(
            "You have to add the method 'get_serializer_class' to your "
            "access permissions class.".format(self))

    def get_full_data(self, instance: Model) -> Dict[str, Any]:
        """
        Returns all possible serialized data for the given instance.
        """
        return self.get_serializer_class()(instance).data

    async def get_restricted_data(
            self, full_data: List[Dict[str, Any]],
            user_id: int) -> List[Dict[str, Any]]:
        """
        Returns the restricted serialized data for the instance prepared
        for the user.

        The argument full_data has to be a list of full_data dicts. The type of
        the return is the same. Returns an empty list if the user has no read
        access. Returns reduced data if the user has limited access. Default:
        Returns full data if the user has read access to model instances.

        Hint: You should override this method if your get_serializer_class()
        method returns different serializers for different users or if you
        have access restrictions in your view or viewset in methods like
        retrieve() or list().
        """
        return full_data if await self.async_check_permissions(user_id) else []


class RequiredUsers:
    """
    Helper class to find all users that are required by another element.
    """

    callables: Dict[str, Callable[[Dict[str, Any]], Set[int]]] = {}

    def get_collection_strings(self) -> Set[str]:
        """
        Returns all collection strings for elements that could have required users.
        """
        return set(self.callables.keys())

    def add_collection_string(self, collection_string: str, callable: Callable[[Dict[str, Any]], Set[int]]) -> None:
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

        all_full_data = await element_cache.get_all_full_data()
        for collection_string in collection_strings:
            # Get the callable for the collection_string
            get_user_ids = self.callables.get(collection_string)
            elements = all_full_data.get(collection_string, {})
            if not (get_user_ids and elements):
                # if the collection_string is unknown or it has no data, do nothing
                continue

            for element in elements:
                user_ids.update(get_user_ids(element))

        return user_ids


required_user = RequiredUsers()
