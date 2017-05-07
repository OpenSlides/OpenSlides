from django.contrib.auth.models import AnonymousUser

from ..utils.access_permissions import BaseAccessPermissions
from ..utils.auth import anonymous_is_enabled, has_perm


class ProjectorAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for Projector and ProjectorViewSet.
    """
    def check_permissions(self, user):
        """
        Returns True if the user has read access model instances.
        """
        return has_perm(user, 'core.can_see_projector')


class TagAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for Tag and TagViewSet.
    """
    def check_permissions(self, user):
        """
        Returns True if the user has read access model instances.
        """
        # Every authenticated user can retrieve tags. Anonymous users can do
        # so if they are enabled.
        return not isinstance(user, AnonymousUser) or anonymous_is_enabled()


class ChatMessageAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for ChatMessage and ChatMessageViewSet.
    """
    def check_permissions(self, user):
        """
        Returns True if the user has read access model instances.
        """
        # Anonymous users can see the chat if the anonymous group has the
        # permission core.can_use_chat. But they can not use it. See views.py.
        return has_perm(user, 'core.can_use_chat')


class ProjectorMessageAccessPermissions(BaseAccessPermissions):
    """
    Access permissions for ProjectorMessage.
    """
    def check_permissions(self, user):
        """
        Returns True if the user has read access model instances.
        """
        return has_perm(user, 'core.can_see_projector')


class CountdownAccessPermissions(BaseAccessPermissions):
    """
    Access permissions for Countdown.
    """
    def check_permissions(self, user):
        """
        Returns True if the user has read access model instances.
        """
        return has_perm(user, 'core.can_see_projector')


class ConfigAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for the config (ConfigStore and
    ConfigViewSet).
    """
    def check_permissions(self, user):
        """
        Returns True if the user has read access model instances.
        """
        # Every authenticated user can see the metadata and list or retrieve
        # the config. Anonymous users can do so if they are enabled.
        return not isinstance(user, AnonymousUser) or anonymous_is_enabled()
