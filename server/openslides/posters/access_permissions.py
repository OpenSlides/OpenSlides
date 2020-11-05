from typing import Any, Dict, List

from openslides.utils.access_permissions import BaseAccessPermissions
from openslides.utils.auth import async_has_perm


class PosterAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for Poster and PosterViewSet.
    """

    base_permission = "posters.can_see"

    async def get_restricted_data(
        self, full_data: List[Dict[str, Any]], user_id: int
    ) -> List[Dict[str, Any]]:
        if await async_has_perm(user_id, "posters.can_manage"):
            data = full_data
        elif await async_has_perm(user_id, "posters.can_see"):
            # remove all posters with published=False
            data = [poster for poster in full_data if poster["published"]]
        else:
            data = []

        return data
