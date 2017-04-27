from ..utils.access_permissions import BaseAccessPermissions
from ..utils.auth import has_perm


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

    def get_restricted_data(self, full_data, user):
        """
        Returns the restricted serialized data for the instance prepared
        for the user.
        """
        def filtered_data(full_data, blocked_keys):
            """
            Returns a new dict like full_data but with all blocked_keys removed.
            """
            whitelist = full_data.keys() - blocked_keys
            return {key: full_data[key] for key in whitelist}

        # many_items is True, when there are more then one items in full_data.
        many_items = not isinstance(full_data, dict)
        full_data = full_data if many_items else [full_data]

        if has_perm(user, 'agenda.can_see'):
            if has_perm(user, 'agenda.can_manage'):
                data = full_data
            elif has_perm(user, 'agenda.can_see_hidden_items'):
                blocked_keys = ('comment',)
                data = [filtered_data(full, blocked_keys) for full in full_data]
            else:
                data = []
                filtered_blocked_keys = full_data[0].keys() - (
                    'id',
                    'title',
                    'speakers',
                    'speaker_list_closed',
                    'content_object')
                not_filtered_blocked_keys = ('comment',)
                for full in full_data:
                    if full['is_hidden']:
                        blocked_keys = filtered_blocked_keys
                    else:
                        blocked_keys = not_filtered_blocked_keys
                    data.append(filtered_data(full, blocked_keys))
        else:
            data = None

        return data if many_items else data[0]

    def get_projector_data(self, full_data):
        """
        Returns the restricted serialized data for the instance prepared
        for the projector. Removes field 'comment'.
        """
        data = {}
        for key in full_data.keys():
            if key != 'comment':
                data[key] = full_data[key]
        return data
