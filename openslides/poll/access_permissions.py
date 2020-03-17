import json
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


class BaseOptionAccessPermissions(BaseAccessPermissions):
    manage_permission = ""  # set by subclass

    async def get_restricted_data(
        self, full_data: List[Dict[str, Any]], user_id: int
    ) -> List[Dict[str, Any]]:

        if await async_has_perm(user_id, self.manage_permission):
            data = full_data
        else:
            data = []
            for option in full_data:
                if option["pollstate"] != BasePoll.STATE_PUBLISHED:
                    option = json.loads(
                        json.dumps(option)
                    )  # copy, so we can remove some fields.
                    del option["yes"]
                    del option["no"]
                    del option["abstain"]
                data.append(option)
        return data


class BasePollAccessPermissions(BaseAccessPermissions):
    manage_permission = ""  # set by subclass

    additional_fields: List[str] = []
    """ Add fields to be removed from each unpublished poll """

    async def get_restricted_data(
        self, full_data: List[Dict[str, Any]], user_id: int
    ) -> List[Dict[str, Any]]:
        """
        Poll-managers have full access, even during an active poll.
        Non-published polls will be restricted:
         - Remove votes* values from the poll
         - Remove yes/no/abstain fields from options
         - Remove fields given in self.assitional_fields from the poll
        """

        # add has_voted for all users to check whether op has voted
        for poll in full_data:
            poll["user_has_voted"] = user_id in poll["voted_id"]

        if await async_has_perm(user_id, self.manage_permission):
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
                    for field in self.additional_fields:
                        del poll[field]
                data.append(poll)
        return data
