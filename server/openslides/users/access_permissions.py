from typing import Any, Dict, List, Set

from ..utils.access_permissions import BaseAccessPermissions, required_user
from ..utils.auth import async_has_perm
from ..utils.utils import get_model_from_collection_string


class UserAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for User and UserViewSet.
    """

    async def get_restricted_data(
        self, full_data: List[Dict[str, Any]], user_id: int
    ) -> List[Dict[str, Any]]:
        """
        Returns the restricted serialized data for the instance prepared
        for the user. Removes several fields for non admins so that they do
        not get the fields they should not get.
        """
        from .serializers import (
            USERCANSEEEXTRASERIALIZER_FIELDS,
            USERCANSEESERIALIZER_FIELDS,
        )

        def filtered_data(full_data, whitelist, whitelist_operator=None):
            """
            Returns a new dict like full_data but only with whitelisted keys.
            If the whitelist_operator is given and the full_data-user is the
            oeperator (the user with user_id), the whitelist_operator will
            be used instead of the whitelist.
            """
            if whitelist_operator is not None and full_data["id"] == user_id:
                return {key: full_data[key] for key in whitelist_operator}
            else:
                return {key: full_data[key] for key in whitelist}

        # We have some sets of data to be sent:
        # * full data i. e. all fields (including session_auth_hash),
        # * all data i. e. all fields but not session_auth_hash,
        # * many data i. e. all fields but not the default password and session_auth_hash,
        # * little data i. e. all fields but not the default password, session_auth_hash,
        #   comments, gender, email, last_email_send, active status and auth_type
        # * own data i. e. all little data fields plus email and gender. This is applied
        #   to the own user, if he just can see little or no data.
        # * no data.

        # Prepare field set for users with "all" data, "many" data and with "little" data.
        all_data_fields = set(USERCANSEEEXTRASERIALIZER_FIELDS)
        all_data_fields.add("groups_id")
        all_data_fields.discard("groups")
        all_data_fields.add("default_password")
        many_data_fields = all_data_fields.copy()
        many_data_fields.discard("default_password")
        little_data_fields = set(USERCANSEESERIALIZER_FIELDS)
        little_data_fields.add("groups_id")
        little_data_fields.discard("groups")
        own_data_fields = set(little_data_fields)
        own_data_fields.add("email")
        own_data_fields.add("gender")
        own_data_fields.add("vote_delegated_to_id")
        own_data_fields.add("vote_delegated_from_users_id")

        # Check user permissions.
        if await async_has_perm(user_id, "users.can_see_name"):
            whitelist_operator = None
            if await async_has_perm(user_id, "users.can_see_extra_data"):
                if await async_has_perm(user_id, "users.can_manage"):
                    whitelist = all_data_fields
                else:
                    whitelist = many_data_fields
            else:
                whitelist = little_data_fields
                whitelist_operator = own_data_fields

            # for managing {motion, assignment} polls the users needs to know
            # the vote delegation structure.
            if await async_has_perm(
                user_id, "motion.can_manage_polls"
            ) or await async_has_perm(user_id, "assignments.can_manage"):
                whitelist.add("vote_delegated_to_id")
                whitelist.add("vote_delegated_from_users_id")

            data = [
                filtered_data(full, whitelist, whitelist_operator) for full in full_data
            ]
        else:
            # Build a list of users, that can be seen without any permissions (with little fields).

            # Everybody can see himself. Also everybody can see every user
            # that is required e. g. as speaker, motion submitter or
            # assignment candidate.

            can_see_collection_strings: Set[str] = set()
            for collection_string in required_user.get_collection_strings():
                if await async_has_perm(
                    user_id,
                    get_model_from_collection_string(
                        collection_string
                    ).can_see_permission,
                ):
                    can_see_collection_strings.add(collection_string)

            required_user_ids = await required_user.get_required_users(
                can_see_collection_strings
            )

            # Add oneself.
            if user_id:
                required_user_ids.add(user_id)

            # add vote delegations
            # Find our model in full_data and get vote_delegated_from_users_id from it.
            for user in full_data:
                if user["id"] == user_id:
                    required_user_ids.update(user["vote_delegated_from_users_id"])
                    break

            # Parse data.
            data = [
                filtered_data(full, little_data_fields, own_data_fields)
                for full in full_data
                if full["id"] in required_user_ids
            ]

        return data


class GroupAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for Groups. Everyone can see them
    """


class PersonalNoteAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for personal notes. Every authenticated user
    can handle personal notes.
    """

    async def get_restricted_data(
        self, full_data: List[Dict[str, Any]], user_id: int
    ) -> List[Dict[str, Any]]:
        """
        Returns the restricted serialized data for the instance prepared
        for the user. Everybody gets only his own personal notes.
        """
        # Parse data.
        if not user_id:
            data: List[Dict[str, Any]] = []
        else:
            for full in full_data:
                if full["user_id"] == user_id:
                    data = [full]
                    break
            else:
                data = []

        return data
