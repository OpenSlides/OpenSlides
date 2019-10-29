import json
from typing import Any, Dict, List

from ..poll.access_permissions import BaseVoteAccessPermissions
from ..poll.views import BasePoll
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


class AssignmentPollAccessPermissions(BaseAccessPermissions):
    base_permission = "assignments.can_see"

    async def get_restricted_data(
        self, full_data: List[Dict[str, Any]], user_id: int
    ) -> List[Dict[str, Any]]:
        """
        Poll-managers have full access, even during an active poll.
        Non-published polls will be restricted:
         - Remove votes* values from the poll
         - Remove yes/no/abstain fields from options
         - Remove voted_id field from the poll
        """

        if await async_has_perm(user_id, "assignments.can_manage_polls"):
            data = full_data
        else:
            data = []
            for poll in full_data:
                if poll["state"] != BasePoll.STATE_PUBLISHED:
                    poll = json.loads(
                        json.dumps(poll)
                    )  # copy, so we can remove some fields.
                    del poll["votesvalid"]
                    del poll["votesinvalid"]
                    del poll["votescast"]
                    del poll["voted_id"]
                    for option in poll["options"]:
                        del option["yes"]
                        del option["no"]
                        del option["abstain"]
                data.append(poll)
        return data


class AssignmentVoteAccessPermissions(BaseVoteAccessPermissions):
    base_permission = "assignments.can_see"
    manage_permission = "assignments.can_manage"
