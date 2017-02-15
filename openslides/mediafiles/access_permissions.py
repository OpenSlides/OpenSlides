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
        if has_perm(user, 'mediafiles.can_see'):
            if (not full_data['hidden'] or has_perm(user, 'mediafiles.can_see_hidden')):
                data = full_data
        return data
