from ..utils.access_permissions import BaseAccessPermissions
from ..utils.auth import GROUP_ADMIN_PK, async_in_some_groups


class ProjectorAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for Projector and ProjectorViewSet.
    """
    base_permission = 'core.can_see_projector'

    def get_serializer_class(self, user=None):
        """
        Returns serializer class.
        """
        from .serializers import ProjectorSerializer

        return ProjectorSerializer


class TagAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for Tag and TagViewSet.
    """

    def get_serializer_class(self, user=None):
        """
        Returns serializer class.
        """
        from .serializers import TagSerializer

        return TagSerializer


class ChatMessageAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for ChatMessage and ChatMessageViewSet.
    """
    base_permission = 'core.can_use_chat'

    def get_serializer_class(self, user=None):
        """
        Returns serializer class.
        """
        from .serializers import ChatMessageSerializer

        return ChatMessageSerializer


class ProjectorMessageAccessPermissions(BaseAccessPermissions):
    """
    Access permissions for ProjectorMessage.
    """
    base_permission = 'core.can_see_projector'

    def get_serializer_class(self, user=None):
        """
        Returns serializer class.
        """
        from .serializers import ProjectorMessageSerializer

        return ProjectorMessageSerializer


class CountdownAccessPermissions(BaseAccessPermissions):
    """
    Access permissions for Countdown.
    """
    base_permission = 'core.can_see_projector'

    def get_serializer_class(self, user=None):
        """
        Returns serializer class.
        """
        from .serializers import CountdownSerializer

        return CountdownSerializer


class ConfigAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for the config (ConfigStore and
    ConfigViewSet).
    """

    def get_serializer_class(self, user=None):
        """
        Returns serializer class.
        """
        from .serializers import ConfigSerializer

        return ConfigSerializer


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

    def get_serializer_class(self, user=None):
        """
        Returns serializer class.
        """
        from .serializers import HistorySerializer

        return HistorySerializer
