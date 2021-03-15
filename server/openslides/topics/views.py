from openslides.utils.rest_api import ModelViewSet

from ..utils.auth import has_perm
from .models import Topic


class TopicViewSet(ModelViewSet):
    """
    API endpoint for topics.

    There are the following views: metadata, list, retrieve, create,
    partial_update, update and destroy.
    """

    queryset = Topic.objects.all()

    def check_view_permissions(self):
        """
        Returns True if the user has required permissions.
        """
        if self.action in ("create", "update", "partial_update", "destroy"):
            result = has_perm(self.request.user, "agenda.can_manage")
        else:
            result = False
        return result
