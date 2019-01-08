from ..utils.access_permissions import BaseAccessPermissions


class TopicAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for Topic and TopicViewSet.
    """

    base_permission = "agenda.can_see"
