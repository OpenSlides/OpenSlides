from openslides.utils.rest_api import ModelViewSet

from ..utils.auth import has_perm
from .access_permissions import TopicAccessPermissions
from .models import Topic


class TopicViewSet(ModelViewSet):
    """
    API endpoint for topics.

    There are the following views: metadata, list, retrieve, create,
    partial_update, update and destroy.
    """

    access_permissions = TopicAccessPermissions()
    queryset = Topic.objects.all()

    def check_view_permissions(self):
        """
        Returns True if the user has required permissions.
        """
        if self.action in ("list", "retrieve"):
            result = self.get_access_permissions().check_permissions(self.request.user)
        else:
            result = has_perm(self.request.user, "agenda.can_manage")
        return result
