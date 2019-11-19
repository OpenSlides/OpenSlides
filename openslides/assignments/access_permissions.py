from ..poll.access_permissions import (
    BasePollAccessPermissions,
    BaseVoteAccessPermissions,
)
from ..utils.access_permissions import BaseAccessPermissions


class AssignmentAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for Assignment and AssignmentViewSet.
    """

    base_permission = "assignments.can_see"


class AssignmentPollAccessPermissions(BasePollAccessPermissions):
    base_permission = "assignments.can_see"
    manage_permission = "assignments.can_manage_polls"
    additional_fields = ["amount_global_no", "amount_global_abstain"]


class AssignmentVoteAccessPermissions(BaseVoteAccessPermissions):
    base_permission = "assignments.can_see"
    manage_permission = "assignments.can_manage"
