from django.contrib.auth.models import AnonymousUser

from ..core.signals import user_data_required
from ..utils.access_permissions import BaseAccessPermissions
from ..utils.auth import anonymous_is_enabled, has_perm
from ..utils.collection import Collection


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

    def get_restricted_data(self, container, user):
        """
        Returns the restricted serialized data for the instance prepared
        for the user. Removes several fields for non admins so that they do
        not get the fields they should not get.
        """
        from .serializers import USERCANSEESERIALIZER_FIELDS, USERCANSEEEXTRASERIALIZER_FIELDS

        def filtered_data(full_data, whitelist):
            """
            Returns a new dict like full_data but only with whitelisted keys.
            """
            return {key: full_data[key] for key in whitelist}

        # Expand full_data to a list if it is not one.
        full_data = container.get_full_data() if isinstance(container, Collection) else [container.get_full_data()]

        # We have four sets of data to be sent:
        # * full data i. e. all fields,
        # * many data i. e. all fields but not the default password,
        # * little data i. e. all fields but not the default password, comments and active status,
        # * no data.

        # Prepare field set for users with "many" data and with "little" data.
        many_data_fields = set(USERCANSEEEXTRASERIALIZER_FIELDS)
        many_data_fields.add('groups_id')
        many_data_fields.discard('groups')
        litte_data_fields = set(USERCANSEESERIALIZER_FIELDS)
        litte_data_fields.add('groups_id')
        litte_data_fields.discard('groups')

        # Check user permissions.
        if has_perm(user, 'users.can_see_name'):
            if has_perm(user, 'users.can_see_extra_data'):
                if has_perm(user, 'users.can_manage'):
                    data = full_data
                else:
                    data = [filtered_data(full, many_data_fields) for full in full_data]
            else:
                data = [filtered_data(full, litte_data_fields) for full in full_data]
        else:
            # Build a list of users, that can be seen without any permissions (with little fields).

            user_ids = set()

            # Everybody can see himself. Also everybody can see every user
            # that is required e. g. as speaker, motion submitter or
            # assignment candidate.

            # Add oneself.
            if user is not None:
                user_ids.add(user.id)

            # Get a list of all users, that are required by another app.
            receiver_responses = user_data_required.send(
                sender=self.__class__,
                request_user=user)
            for receiver, response in receiver_responses:
                user_ids.update(response)

            # Parse data.
            data = [
                filtered_data(full, litte_data_fields)
                for full
                in full_data
                if full['id'] in user_ids]

        # Reduce result to a single item or None if it was not a collection at
        # the beginning of the method.
        if isinstance(container, Collection):
            restricted_data = data
        elif data:
            restricted_data = data[0]
        else:
            restricted_data = None

        return restricted_data

    def get_projector_data(self, container):
        """
        Returns the restricted serialized data for the instance prepared
        for the projector. Removes several fields.
        """
        from .serializers import USERCANSEESERIALIZER_FIELDS

        def filtered_data(full_data, whitelist):
            """
            Returns a new dict like full_data but only with whitelisted keys.
            """
            return {key: full_data[key] for key in whitelist}

        # Expand full_data to a list if it is not one.
        full_data = container.get_full_data() if isinstance(container, Collection) else [container.get_full_data()]

        # Parse data.
        litte_data_fields = set(USERCANSEESERIALIZER_FIELDS)
        litte_data_fields.add('groups_id')
        litte_data_fields.discard('groups')
        data = [filtered_data(full, litte_data_fields) for full in full_data]

        # Reduce result to a single item or None if it was not a collection at
        # the beginning of the method.
        if isinstance(container, Collection):
            projector_data = data
        elif data:
            projector_data = data[0]
        else:
            projector_data = None

        return projector_data


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


class PersonalNoteAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for personal notes. Every authenticated user
    can handle personal notes.
    """
    def check_permissions(self, user):
        """
        Returns True if the user has read access model instances.
        """
        # Every authenticated user can retrieve personal notes.
        return not isinstance(user, AnonymousUser)

    def get_serializer_class(self, user=None):
        """
        Returns serializer class.
        """
        from .serializers import PersonalNoteSerializer

        return PersonalNoteSerializer

    def get_restricted_data(self, container, user):
        """
        Returns the restricted serialized data for the instance prepared
        for the user. Everybody gets only his own personal notes.
        """
        # Expand full_data to a list if it is not one.
        full_data = container.get_full_data() if isinstance(container, Collection) else [container.get_full_data()]

        restricted_data = None
        if user is not None:
            # Parse data.
            for full in full_data:
                if full['user_id'] == user.id:
                    data = [full]
                    break
            else:
                data = []

            # Reduce result to a single item or None if it was not a collection at
            # the beginning of the method.
            if isinstance(container, Collection):
                restricted_data = data
            elif data:
                restricted_data = data[0]
            else:
                restricted_data = None

        return restricted_data
