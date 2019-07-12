from typing import Any, Dict, List, cast

from ..utils.access_permissions import BaseAccessPermissions
from ..utils.auth import async_has_perm, async_in_some_groups


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

        data = []
        for full in full_data:
            access_groups = full["inherited_access_groups_id"]
            if (
                isinstance(access_groups, bool) and access_groups
            ) or await async_in_some_groups(user_id, cast(List[int], access_groups)):
                data.append(full)

        return data
