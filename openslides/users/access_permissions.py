from ..utils.access_permissions import BaseAccessPermissions


class UserAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for User and UserViewSet.
    """
    def can_retrieve(self, user):
        """
        Returns True if the user has read access model instances.
        """
        return user.has_perm('users.can_see_name')

    def get_serializer_class(self, user):
        """
        Returns different serializer classes with respect user's permissions.
        """
        from .serializers import UserFullSerializer, UserShortSerializer

        if user.has_perm('users.can_see_extra_data'):
            # Return the UserFullSerializer for requests of users with more
            # permissions.
            serializer_class = UserFullSerializer
        else:
            serializer_class = UserShortSerializer
        return serializer_class
