from typing import Any, Dict, List, Optional

from ..utils.access_permissions import BaseAccessPermissions
from ..utils.auth import async_has_perm
from ..utils.collection import CollectionElement


class MediafileAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for Mediafile and MediafileViewSet.
    """
    base_permission = 'mediafiles.can_see'

    def get_serializer_class(self, user=None):
        """
        Returns serializer class.
        """
        from .serializers import MediafileSerializer

        return MediafileSerializer

    async def get_restricted_data(
            self,
            full_data: List[Dict[str, Any]],
            user: Optional[CollectionElement]) -> List[Dict[str, Any]]:
        """
        Returns the restricted serialized data for the instance prepared
        for the user. Removes hidden mediafiles for  some users.
        """
        # Parse data.
        if await async_has_perm(user, 'mediafiles.can_see') and await async_has_perm(user, 'mediafiles.can_see_hidden'):
            data = full_data
        elif await async_has_perm(user, 'mediafiles.can_see'):
            # Exclude hidden mediafiles.
            data = [full for full in full_data if not full['hidden']]
        else:
            data = []

        return data
