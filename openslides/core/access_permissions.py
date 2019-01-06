from ..utils.access_permissions import BaseAccessPermissions
from ..utils.auth import GROUP_ADMIN_PK, async_in_some_groups


class ProjectorAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for Projector and ProjectorViewSet.
    """

    base_permission = "core.can_see_projector"


class TagAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for Tag and TagViewSet.
    """


class ChatMessageAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for ChatMessage and ChatMessageViewSet.
    """

    base_permission = "core.can_use_chat"


class ProjectorMessageAccessPermissions(BaseAccessPermissions):
    """
    Access permissions for ProjectorMessage.
    """

    base_permission = "core.can_see_projector"


class CountdownAccessPermissions(BaseAccessPermissions):
    """
    Access permissions for Countdown.
    """

    base_permission = "core.can_see_projector"


class ConfigAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for the config (ConfigStore and
    ConfigViewSet).
    """


class HistoryAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for the Histroy.
    """

    async def async_check_permissions(self, user_id: int) -> bool:
        """
        Returns True if the user is in admin group and has read access to
        model instances.
        """
        return await async_in_some_groups(user_id, [GROUP_ADMIN_PK])
