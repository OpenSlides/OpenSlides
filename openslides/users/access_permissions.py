from ..utils.access_permissions import BaseAccessPermissions


class UserAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for User and UserViewSet.
    """
    def check_permissions(self, user):
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

        NO_DATA = 0
        LITTLE_DATA = 1
        MANY_DATA = 2
        FULL_DATA = 3

        # Check user permissions.
        if user.has_perm('users.can_see_name'):
            if user.has_perm('users.can_see_extra_data'):
                if user.has_perm('users.can_manage'):
                    case = FULL_DATA
                else:
                    case = MANY_DATA
            else:
                case = LITTLE_DATA
        else:
            case = NO_DATA

        # Setup data.
        if case == FULL_DATA:
            data = full_data
        elif case == NO_DATA:
            data = None
        else:
            # case in (LITTLE_DATA, ḾANY_DATA)
            if case == MANY_DATA:
                fields = USERCANSEEEXTRASERIALIZER_FIELDS
            else:
                # case == LITTLE_DATA
                fields = USERCANSEESERIALIZER_FIELDS
            # Let only some fields pass this method.
            data = {}
            for key in full_data.keys():
                if key in fields:
                    data[key] = full_data[key]
        return data

    def get_projector_data(self, full_data):
        """
        Returns the restricted serialized data for the instance prepared
        for the projector. Removes several fields.
        """
        from .serializers import USERCANSEESERIALIZER_FIELDS

        # Let only some fields pass this method.
        data = {}
        for key in full_data.keys():
            if key in USERCANSEESERIALIZER_FIELDS:
                data[key] = full_data[key]
        return data
