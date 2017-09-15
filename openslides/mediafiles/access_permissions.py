from typing import Any, Dict, List, Optional

from ..utils.access_permissions import BaseAccessPermissions  # noqa
from ..utils.auth import has_perm
from ..utils.collection import CollectionElement


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

    def get_restricted_data(
            self,
            full_data: List[Dict[str, Any]],
            user: Optional[CollectionElement]) -> List[Dict[str, Any]]:
        """
        Returns the restricted serialized data for the instance prepared
        for the user. Removes hidden mediafiles for  some users.
        """
        # Parse data.
        if has_perm(user, 'mediafiles.can_see') and has_perm(user, 'mediafiles.can_see_hidden'):
            data = full_data
        elif has_perm(user, 'mediafiles.can_see'):
            # Exclude hidden mediafiles.
            data = [full for full in full_data if not full['hidden']]
        else:
            data = []

        return data
