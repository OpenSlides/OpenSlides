from ..utils.access_permissions import BaseAccessPermissions


class MediafileAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for Mediafile and MediafileViewSet.
    """
    def check_permissions(self, user):
        """
        Returns True if the user has read access model instances.
        """
        return user.has_perm('mediafiles.can_see')

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
        if (not full_data['hidden'] or user.has_perm('mediafiles.can_see_hidden')):
            data = full_data
        else:
            data = None
        return data
