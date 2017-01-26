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
    def check_permissions(self, user):
        """
        Returns True if the user has read access model instances.
        """
        # Every authenticated user can retrieve tags. Anonymous users can do
        # so if they are enabled.
        return not isinstance(user, AnonymousUser) or anonymous_is_enabled()

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
    def check_permissions(self, user):
        """
        Returns True if the user has read access model instances.
        """
        # Anonymous users can see the chat if the anonymous group has the
        # permission core.can_use_chat. But they can not use it. See views.py.
        return has_perm(user, 'core.can_use_chat')

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
    def check_permissions(self, user):
        """
        Returns True if the user has read access model instances.
        """
        return has_perm(user, 'core.can_see_projector')

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
    def check_permissions(self, user):
        """
        Returns True if the user has read access model instances.
        """
        return has_perm(user, 'core.can_see_projector')

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
    def check_permissions(self, user):
        """
        Returns True if the user has read access model instances.
        """
        # Every authenticated user can see the metadata and list or retrieve
        # the config. Anonymous users can do so if they are enabled.
        return not isinstance(user, AnonymousUser) or anonymous_is_enabled()

    def get_full_data(self, instance):
        """
        Returns the serlialized config data.
        """
        from .config import config
        from .models import ConfigStore

        # Attention: The format of this response has to be the same as in
        # the retrieve method of ConfigViewSet.
        if isinstance(instance, ConfigStore):
            result = {'key': instance.key, 'value': config[instance.key]}
        else:
            # It is possible, that the caching system already sends the correct data as "instance".
            result = instance
        return result
