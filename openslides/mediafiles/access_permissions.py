from typing import Any, Dict, List

from ..utils.access_permissions import BaseAccessPermissions
from ..utils.auth import async_has_perm, async_in_some_groups, async_is_superadmin


class MediafileAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for Mediafile and MediafileViewSet.
    """

    base_permission = "mediafiles.can_see"

    async def get_restricted_data(
        self, full_data: List[Dict[str, Any]], user_id: int
    ) -> List[Dict[str, Any]]:
        """
        Returns the restricted serialized data for the instance prepared
        for the user. Removes hidden mediafiles for some users.
        """
        if not await async_has_perm(user_id, "mediafiles.can_see"):
            return []

        # This allows to see everything, which is important for inherited_access_groups=False.
        if await async_is_superadmin(user_id):
            return full_data

        data = []
        for full in full_data:
            access_groups = full["inherited_access_groups_id"]
            if (isinstance(access_groups, bool) and access_groups) or (
                isinstance(access_groups, list)
                and await async_in_some_groups(user_id, access_groups)
            ):
                data.append(full)

        return data
