from ..utils.access_permissions import BaseAccessPermissions
from ..utils.auth import has_perm


class TopicAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for Topic and TopicViewSet.
    """
    def check_permissions(self, user):
        """
        Returns True if the user has read access model instances.
        """
        return has_perm(user, 'agenda.can_see')

    def get_serializer_class(self, user=None):
        """
        Returns serializer class.
        """
        from .serializers import TopicSerializer

        return TopicSerializer
