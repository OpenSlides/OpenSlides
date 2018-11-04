from typing import Any, Dict, List

from ..utils.access_permissions import BaseAccessPermissions
from ..utils.auth import async_has_perm


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
            user_id: int) -> List[Dict[str, Any]]:
        """
        Returns the restricted serialized data for the instance prepared
        for the user. Removes hidden mediafiles for some users.
        """
        # Parse data.
        if await async_has_perm(user_id, 'mediafiles.can_see') and await async_has_perm(user_id, 'mediafiles.can_see_hidden'):
            data = full_data
        elif await async_has_perm(user_id, 'mediafiles.can_see'):
            # Exclude hidden mediafiles.
            data = [full for full in full_data if not full['hidden']]
        else:
            data = []

        return data
