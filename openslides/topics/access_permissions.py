from ..utils.access_permissions import BaseAccessPermissions


class TopicAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for Topic and TopicViewSet.
    """
    def check_permissions(self, user):
        """
        Returns True if the user has read access model instances.
        """
        return user.has_perm('agenda.can_see')

    def get_serializer_class(self, user=None):
        """
        Returns serializer class.
        """
        from .serializers import TopicSerializer

        return TopicSerializer
