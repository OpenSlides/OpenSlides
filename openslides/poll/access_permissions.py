from typing import Any, Dict, List

from ..poll.views import BasePoll
from ..utils.access_permissions import BaseAccessPermissions
from ..utils.auth import async_has_perm


class BaseVoteAccessPermissions(BaseAccessPermissions):
    manage_permission = ""  # set by subclass

    async def get_restricted_data(
        self, full_data: List[Dict[str, Any]], user_id: int
    ) -> List[Dict[str, Any]]:
        """
        Poll-managers have full access, even during an active poll.
        Every user can see it's own votes.
        If the pollstate is published, everyone can see the votes.
        """

        if await async_has_perm(user_id, self.manage_permission):
            data = full_data
        else:
            data = [
                vote
                for vote in full_data
                if vote["pollstate"] == BasePoll.STATE_PUBLISHED
                or vote["user_id"] == user_id
            ]
        return data
