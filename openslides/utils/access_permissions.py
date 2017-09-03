from typing import Any, Dict, List, Optional, Union

from django.db.models import Model
from rest_framework.serializers import Serializer

from .collection import Collection, CollectionElement

Container = Union[CollectionElement, Collection]
RestrictedData = Union[List[Dict[str, Any]], Dict[str, Any], None]


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

    def get_serializer_class(self, user: CollectionElement=None) -> Serializer:
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

    def get_restricted_data(self, container: Container, user: Optional[CollectionElement]) -> RestrictedData:
        """
        Returns the restricted serialized data for the instance prepared
        for the user.

        The argument container should be a CollectionElement or a
        Collection. The type of the return value is a dictionary or a list
        according to the given type (or None). Returns None or an empty
        list if the user has no read access. Returns reduced data if the
        user has limited access. Default: Returns full data if the user has
        read access to model instances.

        Hint: You should override this method if your get_serializer_class()
        method returns different serializers for different users or if you
        have access restrictions in your view or viewset in methods like
        retrieve() or list().
        """
        if self.check_permissions(user):
            data = container.get_full_data()
        elif isinstance(container, Collection):
            data = []
        else:
            data = None
        return data

    def get_projector_data(self, container: Container) -> RestrictedData:
        """
        Returns the serialized data for the projector. Returns None if the
        user has no access to this specific data. Returns reduced data if
        the user has limited access. Default: Returns full data.
        """
        return container.get_full_data()
