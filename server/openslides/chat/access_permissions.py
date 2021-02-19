from typing import Any, Dict, List

from openslides.utils.access_permissions import BaseAccessPermissions
from openslides.utils.auth import async_has_perm, async_in_some_groups


class ChatGroupAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for ChatGroup and ChatGroupViewSet.
    No base perm: The access permissions are done with the read/write groups.
    """

    async def get_restricted_data(
        self, full_data: List[Dict[str, Any]], user_id: int
    ) -> List[Dict[str, Any]]:
        """
        Manage users can see all groups. Else, for each group either it has no access groups
        or the user must be in an access group.
        """
        data: List[Dict[str, Any]] = []
        if await async_has_perm(user_id, "chat.can_manage"):
            data = full_data
        else:
            for full in full_data:
                read_groups = full.get("read_groups_id", [])
                write_groups = full.get("write_groups_id", [])
                if await async_in_some_groups(
                    user_id, read_groups
                ) or await async_in_some_groups(user_id, write_groups):
                    data.append(full)
        return data


class ChatMessageAccessPermissions(ChatGroupAccessPermissions):
    """
    Access permissions container for ChatMessage and ChatMessageViewSet.
    It does exaclty the same as ChatGroupAccessPermissions
    """

    pass
