from typing import Any, Dict, List, Optional

from django.db.models import Model
from rest_framework.serializers import Serializer

from .collection import CollectionElement


class BaseAccessPermissions:
    """
    Base access permissions container.

    Every app which has autoupdate models has to create classes subclassing
    from this base class for every autoupdate root model.
    """

    def check_permissions(self, user: Optional[CollectionElement]) -> bool:
        """
        Returns True if the user has read access to model instances.
        """
        return False

    def get_serializer_class(self, user: CollectionElement = None) -> Serializer:
        """
        Returns different serializer classes according to users permissions.

        This should return the serializer for full data access if user is
        None. See get_full_data().
        """
        raise NotImplementedError(
            "You have to add the method 'get_serializer_class' to your "
            "access permissions class.".format(self))

    def get_full_data(self, instance: Model) -> Dict[str, Any]:
        """
        Returns all possible serialized data for the given instance.
        """
        return self.get_serializer_class(user=None)(instance).data

    def get_restricted_data(
            self, full_data: List[Dict[str, Any]],
            user: Optional[CollectionElement]) -> List[Dict[str, Any]]:
        """
        Returns the restricted serialized data for the instance prepared
        for the user.

        The argument full_data has to be a list of full_data dicts as they are
        created with CollectionElement.get_full_data(). The type of the return
        is the same. Returns an empty list if the user has no read access.
        Returns reduced data if the user has limited access.
        Default: Returns full data if the user has read access to model instances.

        Hint: You should override this method if your get_serializer_class()
        method returns different serializers for different users or if you
        have access restrictions in your view or viewset in methods like
        retrieve() or list().
        """
        return full_data if self.check_permissions(user) else []

    def get_projector_data(self, full_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Returns the serialized data for the projector. Returns an empty list if
        the user has no access to this specific data. Returns reduced data if
        the user has limited access. Default: Returns full data.
        """
        return full_data
