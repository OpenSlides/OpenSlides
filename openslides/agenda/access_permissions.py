from typing import Any, Dict, Iterable, List, Optional  # noqa

from ..utils.access_permissions import BaseAccessPermissions
from ..utils.auth import has_perm
from ..utils.collection import CollectionElement


class ItemAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for Item and ItemViewSet.
    """
    def check_permissions(self, user):
        """
        Returns True if the user has read access model instances.
        """
        return has_perm(user, 'agenda.can_see')

    def get_serializer_class(self, user=None):
        """
        Returns serializer class.
        """
        from .serializers import ItemSerializer

        return ItemSerializer

    # TODO: In the following method we use full_data['is_hidden'] but this can be out of date.

    def get_restricted_data(
            self,
            full_data: List[Dict[str, Any]],
            user: Optional[CollectionElement]) -> List[Dict[str, Any]]:
        """
        Returns the restricted serialized data for the instance prepared
        for the user.

        We remove comments for non admins/managers and a lot of fields of
        hidden items for users without permission to see hidden items.
        """
        def filtered_data(full_data, blocked_keys):
            """
            Returns a new dict like full_data but with all blocked_keys removed.
            """
            whitelist = full_data.keys() - blocked_keys
            return {key: full_data[key] for key in whitelist}

        # Parse data.
        if has_perm(user, 'agenda.can_see'):
            if has_perm(user, 'agenda.can_manage') and has_perm(user, 'agenda.can_see_hidden_items'):
                # Managers with special permission can see everything.
                data = full_data
            elif has_perm(user, 'agenda.can_see_hidden_items'):
                # Non managers with special permission can see everything but comments.
                blocked_keys = ('comment',)
                data = [filtered_data(full, blocked_keys) for full in full_data]
            else:
                # Users without special permissin for hidden items.

                # In hidden case managers and non managers see only some fields
                # so that list of speakers is provided regardless.
                blocked_keys_hidden_case = set(full_data[0].keys()) - set((
                    'id',
                    'title',
                    'speakers',
                    'speaker_list_closed',
                    'content_object'))

                # In non hidden case managers see everything and non managers see
                # everything but comments.
                if has_perm(user, 'agenda.can_manage'):
                    blocked_keys_non_hidden_case = []  # type: Iterable[str]
                else:
                    blocked_keys_non_hidden_case = ('comment',)

                data = []
                for full in full_data:
                    if full['is_hidden']:
                        data.append(filtered_data(full, blocked_keys_hidden_case))
                    else:
                        data.append(filtered_data(full, blocked_keys_non_hidden_case))
        else:
            data = []

        return data

    def get_projector_data(self, full_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Returns the restricted serialized data for the instance prepared
        for the projector. Removes field 'comment'.
        """
        def filtered_data(full_data, blocked_keys):
            """
            Returns a new dict like full_data but with all blocked_keys removed.
            """
            whitelist = full_data.keys() - blocked_keys
            return {key: full_data[key] for key in whitelist}

        # Parse data.
        blocked_keys = ('comment',)
        data = [filtered_data(full, blocked_keys) for full in full_data]

        return data
