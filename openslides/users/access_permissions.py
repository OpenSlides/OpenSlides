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

    def get_serializer_class(self, user=None):
        """
        Returns different serializer classes with respect user's permissions.
        """
        from .serializers import UserFullSerializer, UserShortSerializer

        if user is None or user.has_perm('users.can_see_extra_data'):
            # Return the UserFullSerializer for requests of users with more
            # permissions.
            serializer_class = UserFullSerializer
        else:
            serializer_class = UserShortSerializer
        return serializer_class

    def get_restricted_data(self, full_data, user):
        """
        Returns the restricted serialized data for the instance prepared
        for the user. Removes several fields for non admins so that they do
        not get the default_password or even get only the fields as the
        UserShortSerializer would give them.
        """
        from .serializers import USERSHORTSERIALIZER_FIELDS

        if user.has_perm('users.can_manage'):
            data = full_data
        elif user.has_perm('users.can_see_extra_data'):
            # Only remove default password from full data.
            data = full_data.copy()
            del data['default_password']
        else:
            # Let only fields as in the UserShortSerializer pass this method.
            data = {}
            for key in full_data.keys():
                if key in USERSHORTSERIALIZER_FIELDS:
                    data[key] = full_data[key]
        return data
