from django.contrib.auth.models import AnonymousUser

from ..core.signals import user_data_required
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

        def filtered_data(full_data, only_keys):
            """
            Returns a new dict like full_data but with all blocked_keys removed.
            """
            return {key: full_data[key] for key in only_keys}

        # many_items is True, when there are more then one items in full_data.
        many_items = not isinstance(full_data, dict)
        full_data = full_data if many_items else [full_data]

        many_fields = set(USERCANSEEEXTRASERIALIZER_FIELDS)
        little_fields = set(USERCANSEESERIALIZER_FIELDS)
        many_fields.add('groups_id')
        many_fields.discard('groups')
        little_fields.add('groups_id')
        little_fields.discard('groups')

        # Check user permissions.
        if has_perm(user, 'users.can_see_name'):
            if has_perm(user, 'users.can_see_extra_data'):
                if has_perm(user, 'users.can_manage'):
                    data = full_data
                else:
                    data = [filtered_data(full, many_fields) for full in full_data]
            else:
                data = [filtered_data(full, little_fields) for full in full_data]
        else:
            # Build a list of users, that can be seen without permissions.
            no_perm_users = set()
            if user is not None:
                no_perm_users.add(user.id)

            # Get a list of all users, that are needed by another app
            receiver_responses = user_data_required.send(
                sender=self.__class__,
                request_user=user,
                user_data=full_data)
            for receiver, response in receiver_responses:
                no_perm_users.update(response)

            data = [
                filtered_data(full, little_fields)
                for full
                in full_data
                if full['id'] in no_perm_users]

            # Set data to [None] if data is empty
            data = data or [None]

        return data if many_items else data[0]

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
