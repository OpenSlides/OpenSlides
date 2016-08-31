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
        from .serializers import UserCanSeeSerializer, UserCanSeeExtraSerializer, UserFullSerializer

        if (user is None or (user.has_perm('users.can_see_extra_data') and user.has_perm('users.can_manage'))):
            serializer_class = UserFullSerializer
        elif user.has_perm('users.can_see_extra_data'):
            serializer_class = UserCanSeeExtraSerializer
        else:
            serializer_class = UserCanSeeSerializer
        return serializer_class

    def get_restricted_data(self, full_data, user):
        """
        Returns the restricted serialized data for the instance prepared
        for the user. Removes several fields for non admins so that they do
        not get the fields they should not get.
        """
        from .serializers import USERCANSEESERIALIZER_FIELDS, USERCANSEEEXTRASERIALIZER_FIELDS

        if user.has_perm('users.can_manage'):
            data = full_data
        else:
            if user.has_perm('users.can_see_extra_data'):
                fields = USERCANSEEEXTRASERIALIZER_FIELDS
            else:
                fields = USERCANSEESERIALIZER_FIELDS
            # Let only some fields pass this method.
            data = {}
            for key in full_data.keys():
                if key in fields:
                    data[key] = full_data[key]
        return data
