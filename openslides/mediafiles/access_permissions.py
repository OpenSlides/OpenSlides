from ..utils.access_permissions import BaseAccessPermissions
from ..utils.auth import has_perm


class MediafileAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for Mediafile and MediafileViewSet.
    """
    def check_permissions(self, user):
        """
        Returns True if the user has read access model instances.
        """
        return has_perm(user, 'mediafiles.can_see')

    def get_serializer_class(self, user=None):
        """
        Returns serializer class.
        """
        from .serializers import MediafileSerializer

        return MediafileSerializer

    def get_restricted_data(self, full_data, user):
        """
        Returns the restricted serialized data for the instance prepared
        for the user.
        """
        data = None
        if has_perm(user, 'mediafiles.can_see') and has_perm(user, 'mediafiles.can_see_hidden'):
            data = full_data
        elif has_perm(user, 'mediafiles.can_see'):
            many_items = not isinstance(full_data, dict)
            full_data_list = full_data if many_items else [full_data]
            data = [full_data for full_data in full_data_list if not full_data['hidden']]
            data = data if many_items else data[0]
        else:
            data = None
        return data
