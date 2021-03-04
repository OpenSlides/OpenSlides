from typing import Any, Dict

from ..utils.auth import async_has_perm


async def restrict_user(full_user: Dict[str, Any]) -> Dict[str, Any]:
    """
    Returns the restricted serialized data for the instance prepared
    for the user. Removes several fields for non admins so that they do
    not get the fields they should not get.
    """
    from .serializers import (
        USERCANSEEEXTRASERIALIZER_FIELDS,
        USERCANSEESERIALIZER_FIELDS,
    )

    user_id = full_user["id"]

    def filtered_data(full_user, whitelist):
        """
        Returns a new dict like full_user but only with whitelisted keys.
        """
        return {key: full_user[key] for key in whitelist}

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
        if await async_has_perm(user_id, "users.can_see_extra_data"):
            if await async_has_perm(user_id, "users.can_manage"):
                whitelist = all_data_fields
            else:
                whitelist = many_data_fields
        else:
            whitelist = own_data_fields

        # for managing {motion, assignment} polls the users needs to know
        # the vote delegation structure.
        if await async_has_perm(
            user_id, "motion.can_manage_polls"
        ) or await async_has_perm(user_id, "assignments.can_manage"):
            whitelist.add("vote_delegated_to_id")
            whitelist.add("vote_delegated_from_users_id")

        data = filtered_data(full_user, whitelist)
    else:
        # Parse data.
        data = filtered_data(full_user, own_data_fields)

    return data
