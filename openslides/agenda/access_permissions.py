from typing import Any, Dict, List

from ..utils.access_permissions import BaseAccessPermissions
from ..utils.auth import async_has_perm


class ItemAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for Item and ItemViewSet.
    """

    base_permission = "agenda.can_see"

    # TODO: In the following method we use full_data['is_hidden'] and
    # full_data['is_internal'] but this can be out of date.
    async def get_restricted_data(
        self, full_data: List[Dict[str, Any]], user_id: int
    ) -> List[Dict[str, Any]]:
        """
        Returns the restricted serialized data for the instance prepared
        for the user. If the user does not have agenda.can_see, no data will
        be retuned.

        Hidden items can only be seen by managers with can_manage permission. If a user
        does not have this permission, he is not allowed to see comments.

        Internal items can only be seen by users with can_see_internal_items. If a user
        does not have this permission, he is not allowed to see the duration.
        """

        def filtered_data(full_data, blocked_keys):
            """
            Returns a new dict like full_data but with all blocked_keys removed.
            """
            whitelist = full_data.keys() - blocked_keys
            return {key: full_data[key] for key in whitelist}

        # Parse data.
        if full_data and await async_has_perm(user_id, "agenda.can_see"):
            # Assume the user has all permissions. Restrict this below.
            data = full_data

            blocked_keys: List[str] = []

            # Restrict data for non managers
            if not await async_has_perm(user_id, "agenda.can_manage"):
                data = [
                    full for full in data if not full["is_hidden"]
                ]  # filter hidden items
                blocked_keys.append("comment")

            # Restrict data for users without can_see_internal_items
            if not await async_has_perm(user_id, "agenda.can_see_internal_items"):
                data = [full for full in data if not full["is_internal"]]
                blocked_keys.append("duration")

            if len(blocked_keys) > 0:
                data = [filtered_data(full, blocked_keys) for full in data]
        else:
            data = []

        return data


class ListOfSpeakersAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for ListOfSpeakers and ListOfSpeakersViewSet.
    No data will be restricted, because everyone can see the list of speakers
    at any time.
    """

    base_permission = "agenda.can_see_list_of_speakers"
