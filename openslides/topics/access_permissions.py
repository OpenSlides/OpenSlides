from ..utils.access_permissions import BaseAccessPermissions


class TopicAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for Topic and TopicViewSet.
    """
    base_permission = 'agenda.can_see'

    def get_serializer_class(self, user=None):
        """
        Returns serializer class.
        """
        from .serializers import TopicSerializer

        return TopicSerializer
