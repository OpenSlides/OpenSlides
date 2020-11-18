import json
from typing import Any, Dict, List

from ..poll.views import BasePoll
from ..utils import logging
from ..utils.access_permissions import BaseAccessPermissions
from ..utils.auth import async_has_perm, user_collection_string
from ..utils.cache import element_cache


logger = logging.getLogger(__name__)


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
        elif await async_has_perm(user_id, self.base_permission):
            data = [
                vote
                for vote in full_data
                if vote["pollstate"] == BasePoll.STATE_PUBLISHED
                or vote["user_id"] == user_id
                or vote["delegated_user_id"] == user_id
            ]
        else:
            data = []
        return data


class BaseOptionAccessPermissions(BaseAccessPermissions):
    manage_permission = ""  # set by subclass

    async def get_restricted_data(
        self, full_data: List[Dict[str, Any]], user_id: int
    ) -> List[Dict[str, Any]]:

        if await async_has_perm(user_id, self.manage_permission):
            data = full_data
        elif await async_has_perm(user_id, self.base_permission):
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
        else:
            data = []
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
        # also fill user_has_voted_for_delegations with all users for which he has
        # already voted
        user_data = await element_cache.get_element_data(
            user_collection_string, user_id
        )
        if user_data is None:
            logger.error(f"Could not find userdata for {user_id}")
            vote_delegated_from_ids = set()
        else:
            vote_delegated_from_ids = set(user_data["vote_delegated_from_users_id"])

        for poll in full_data:
            poll["user_has_voted"] = user_id in poll["voted_id"]
            voted_ids = set(poll["voted_id"])
            voted_for_delegations = list(
                vote_delegated_from_ids.intersection(voted_ids)
            )
            poll["user_has_voted_for_delegations"] = voted_for_delegations

        if await async_has_perm(user_id, self.manage_permission):
            data = full_data
        elif await async_has_perm(user_id, self.base_permission):
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
        else:
            data = []
        return data
