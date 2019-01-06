from typing import Any, Dict, List

from ..utils.access_permissions import BaseAccessPermissions
from ..utils.auth import async_has_perm


class AssignmentAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for Assignment and AssignmentViewSet.
    """

    base_permission = "assignments.can_see"

    async def get_restricted_data(
        self, full_data: List[Dict[str, Any]], user_id: int
    ) -> List[Dict[str, Any]]:
        """
        Returns the restricted serialized data for the instance prepared
        for the user. Removes unpublished polls for non admins so that they
        only get a result like the AssignmentShortSerializer would give them.
        """
        # Parse data.
        if await async_has_perm(
            user_id, "assignments.can_see"
        ) and await async_has_perm(user_id, "assignments.can_manage"):
            data = full_data
        elif await async_has_perm(user_id, "assignments.can_see"):
            # Exclude unpublished poll votes.
            data = []
            for full in full_data:
                full_copy = full.copy()
                polls = full_copy["polls"]
                for poll in polls:
                    if not poll["published"]:
                        for option in poll["options"]:
                            option["votes"] = []  # clear votes for not published polls
                        poll[
                            "has_votes"
                        ] = False  # A user should see, if there are votes.
                data.append(full_copy)
        else:
            data = []

        return data
