import json
from typing import Any, Dict, List

from ..poll.access_permissions import (
    BaseOptionAccessPermissions,
    BasePollAccessPermissions,
    BaseVoteAccessPermissions,
)
from ..utils.access_permissions import BaseAccessPermissions
from ..utils.auth import async_has_perm, async_in_some_groups


class MotionAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for Motion and MotionViewSet.
    """

    base_permission = "motions.can_see"

    async def get_restricted_data(
        self, full_data: List[Dict[str, Any]], user_id: int
    ) -> List[Dict[str, Any]]:
        """
        Returns the restricted serialized data for the instance prepared for
        the user. Removes motion if the user has not the permission to see
        the motion in this state. Removes comments sections for
        some unauthorized users. Ensures that a user can only see his own
        personal notes.
        """
        # Parse data.
        if await async_has_perm(user_id, "motions.can_see"):
            # TODO: Refactor this after personal_notes system is refactored.
            data = []
            for full in full_data:
                # Check if user is submitter of this motion.
                if user_id:
                    is_submitter = user_id in [
                        submitter["user_id"] for submitter in full.get("submitters", [])
                    ]
                else:
                    # Anonymous users can not be submitters.
                    is_submitter = False

                # Check see permission for this motion.
                restriction = full["state_restriction"]

                # Managers can see all motions.
                permission = await async_has_perm(user_id, "motions.can_manage")
                # If restriction field is an empty list, everybody can see the motion.
                permission = permission or not restriction

                if not permission:
                    # Parse values of restriction field.
                    # If at least one restriction is ok, permissions are granted.
                    for value in restriction:
                        if (
                            value
                            in (
                                "motions.can_see_internal",
                                "motions.can_manage_metadata",
                                "motions.can_manage",
                            )
                            and await async_has_perm(user_id, value)
                        ):
                            permission = True
                            break
                        elif value == "is_submitter" and is_submitter:
                            permission = True
                            break

                # Parse single motion.
                if permission:
                    full_copy = json.loads(json.dumps(full))
                    full_copy["comments"] = []
                    for comment in full["comments"]:
                        if await async_in_some_groups(
                            user_id, comment["read_groups_id"]
                        ):
                            full_copy["comments"].append(comment)
                    data.append(full_copy)
        else:
            data = []
        return data


class MotionChangeRecommendationAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for MotionChangeRecommendation and MotionChangeRecommendationViewSet.
    """

    base_permission = "motions.can_see"

    async def get_restricted_data(
        self, full_data: List[Dict[str, Any]], user_id: int
    ) -> List[Dict[str, Any]]:
        """
        Removes change recommendations if they are internal and the user has
        not the can_manage permission. To see change recommendation the user needs
        the can_see permission.
        """
        # Parse data.
        if await async_has_perm(user_id, self.base_permission):
            has_manage_perms = await async_has_perm(user_id, "motions.can_manage")
            data = []
            for full in full_data:
                if not full["internal"] or has_manage_perms:
                    data.append(full)
        else:
            data = []

        return data


class MotionCommentSectionAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for MotionCommentSection and MotionCommentSectionViewSet.
    """

    base_permission = "motions.can_see"

    async def get_restricted_data(
        self, full_data: List[Dict[str, Any]], user_id: int
    ) -> List[Dict[str, Any]]:
        """
        If the user has manage rights, he can see all sections. If not all sections
        will be removed, when the user is not in at least one of the read_groups.
        """
        data: List[Dict[str, Any]] = []
        if await async_has_perm(user_id, "motions.can_manage"):
            data = full_data
        elif await async_has_perm(user_id, self.base_permission):
            for full in full_data:
                read_groups = full.get("read_groups_id", [])
                if await async_in_some_groups(user_id, read_groups):
                    data.append(full)
        else:
            data = []
        return data


class StatuteParagraphAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for StatuteParagraph and StatuteParagraphViewSet.
    """

    base_permission = "motions.can_see"


class CategoryAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for Category and CategoryViewSet.
    """

    base_permission = "motions.can_see"


class MotionBlockAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for Category and CategoryViewSet.
    """

    base_permission = "motions.can_see"

    async def get_restricted_data(
        self, full_data: List[Dict[str, Any]], user_id: int
    ) -> List[Dict[str, Any]]:
        """
        Users without `motions.can_manage` cannot see internal blocks.
        """
        data: List[Dict[str, Any]] = []
        if await async_has_perm(user_id, "motions.can_manage"):
            data = full_data
        elif await async_has_perm(user_id, self.base_permission):
            data = [full for full in full_data if not full["internal"]]
        else:
            data = []

        return data


class WorkflowAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for Workflow and WorkflowViewSet.
    """

    base_permission = "motions.can_see"


class StateAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for State and StateViewSet.
    """

    base_permission = "motions.can_see"


class MotionPollAccessPermissions(BasePollAccessPermissions):
    base_permission = "motions.can_see"
    manage_permission = "motions.can_manage_polls"


class MotionOptionAccessPermissions(BaseOptionAccessPermissions):
    base_permission = "motions.can_see"
    manage_permission = "motions.can_manage_polls"


class MotionVoteAccessPermissions(BaseVoteAccessPermissions):
    base_permission = "motions.can_see"
    manage_permission = "motions.can_manage_polls"
