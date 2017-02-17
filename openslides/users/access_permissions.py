from django.contrib.auth.models import AnonymousUser

from ..utils.access_permissions import BaseAccessPermissions
from ..utils.auth import anonymous_is_enabled, has_perm


class UserAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for User and UserViewSet.
    """
    def check_permissions(self, user):
        """
        Every user has read access for their model instnces.
        """
        return True

    def get_serializer_class(self, user=None):
        """
        Returns different serializer classes with respect user's permissions.
        """
        from .serializers import UserFullSerializer

        return UserFullSerializer

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
        if has_perm(user, 'users.can_see_name'):
            if has_perm(user, 'users.can_see_extra_data'):
                if has_perm(user, 'users.can_manage'):
                    case = FULL_DATA
                else:
                    case = MANY_DATA
            else:
                case = LITTLE_DATA
        elif user is not None and user.id == full_data.get('id'):
            # An authenticated user without the permission to see users tries
            # to see himself.
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
            for base_key in fields:
                for key in (base_key, base_key + '_id'):
                    if key in full_data.keys():
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


class GroupAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for Groups. Everyone can see them
    """
    def check_permissions(self, user):
        """
        Returns True if the user has read access model instances.
        """
        # Every authenticated user can retrieve groups. Anonymous users can do
        # so if they are enabled.
        return not isinstance(user, AnonymousUser) or anonymous_is_enabled()

    def get_serializer_class(self, user=None):
        """
        Returns serializer class.
        """
        from .serializers import GroupSerializer

        return GroupSerializer
