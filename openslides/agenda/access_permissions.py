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

    # TODO: In the following method we use full_data['is_hidden'] and
    # full_data['is_internal'] but this can be out of date.

    def get_restricted_data(
            self,
            full_data: List[Dict[str, Any]],
            user: Optional[CollectionElement]) -> List[Dict[str, Any]]:
        """
        Returns the restricted serialized data for the instance prepared
        for the user.

        Hidden items can only be seen by managers with can_manage permission.

        We remove comments for non admins/managers and a lot of fields of
        internal items for users without permission to see internal items.
        """
        def filtered_data(full_data, blocked_keys):
            """
            Returns a new dict like full_data but with all blocked_keys removed.
            """
            whitelist = full_data.keys() - blocked_keys
            return {key: full_data[key] for key in whitelist}

        # Parse data.
        if full_data and has_perm(user, 'agenda.can_see'):
            if has_perm(user, 'agenda.can_manage') and has_perm(user, 'agenda.can_see_internal_items'):
                # Managers with special permission can see everything.
                data = full_data
            elif has_perm(user, 'agenda.can_see_internal_items'):
                # Non managers with special permission can see everything but
                # comments and hidden items.
                data = [full for full in full_data if not full['is_hidden']]  # filter hidden items
                blocked_keys = ('comment',)
                data = [filtered_data(full, blocked_keys) for full in data]  # remove blocked_keys
            else:
                # Users without special permission for internal items.

                # In internal and hidden case managers and non managers see only some fields
                # so that list of speakers is provided regardless. Hidden items can only be seen by managers.
                # We know that full_data has at least one entry which can be used to parse the keys.
                blocked_keys_internal_hidden_case = set(full_data[0].keys()) - set((
                    'id',
                    'title',
                    'speakers',
                    'speaker_list_closed',
                    'content_object'))

                # In non internal case managers see everything and non managers see
                # everything but comments.
                if has_perm(user, 'agenda.can_manage'):
                    blocked_keys_non_internal_hidden_case = []  # type: Iterable[str]
                    can_see_hidden = True
                else:
                    blocked_keys_non_internal_hidden_case = ('comment',)
                    can_see_hidden = False

                data = []
                for full in full_data:
                    if full['is_hidden'] and can_see_hidden:
                        # Same filtering for internal and hidden items
                        data.append(filtered_data(full, blocked_keys_internal_hidden_case))
                    elif full['is_internal']:
                        data.append(filtered_data(full, blocked_keys_internal_hidden_case))
                    else:  # agenda item
                        data.append(filtered_data(full, blocked_keys_non_internal_hidden_case))
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
