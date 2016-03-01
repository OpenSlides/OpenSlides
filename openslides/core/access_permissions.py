from ..utils.access_permissions import BaseAccessPermissions


class ProjectorAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for Projector and ProjectorViewSet.
    """
    def can_retrieve(self, user):
        """
        Returns True if the user has read access model instances.
        """
        return user.has_perm('core.can_see_projector')

    def get_serializer_class(self, user=None):
        """
        Returns serializer class.
        """
        from .serializers import ProjectorSerializer

        return ProjectorSerializer


class CustomSlideAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for CustomSlide and CustomSlideViewSet.
    """
    def can_retrieve(self, user):
        """
        Returns True if the user has read access model instances.
        """
        return user.has_perm('core.can_manage_projector')

    def get_serializer_class(self, user=None):
        """
        Returns serializer class.
        """
        from .serializers import CustomSlideSerializer

        return CustomSlideSerializer


class TagAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for Tag and TagViewSet.
    """
    def can_retrieve(self, user):
        """
        Returns True if the user has read access model instances.
        """
        from .config import config

        # Every authenticated user can retrieve tags. Anonymous users can do
        # so if they are enabled.
        return user.is_authenticated() or config['general_system_enable_anonymous']

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
    def can_retrieve(self, user):
        """
        Returns True if the user has read access model instances.
        """
        # Anonymous users can see the chat if the anonymous group has the
        # permission core.can_use_chat. But they can not use it. See views.py.
        return user.has_perm('core.can_use_chat')

    def get_serializer_class(self, user=None):
        """
        Returns serializer class.
        """
        from .serializers import ChatMessageSerializer

        return ChatMessageSerializer


class ConfigAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for the config (ConfigStore and
    ConfigViewSet).
    """
    def can_retrieve(self, user):
        """
        Returns True if the user has read access model instances.
        """
        from .config import config

        # Every authenticated user can see the metadata and list or retrieve
        # the config. Anonymous users can do so if they are enabled.
        return user.is_authenticated() or config['general_system_enable_anonymous']

    def get_full_data(self, instance):
        """
        Returns the serlialized config data.
        """
        from .config import config

        # Attention: The format of this response has to be the same as in
        # the retrieve method of ConfigViewSet.
        return {'key': instance.key, 'value': config[instance.key]}
