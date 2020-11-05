from openslides.posters.access_permissions import PosterAccessPermissions
from openslides.posters.models import Poster
from openslides.utils.auth import has_perm
from openslides.utils.rest_api import ModelViewSet


class PosterViewSet(ModelViewSet):
    """
    API endpoint for posters.

    There are the following views: metadata, list, retrieve, create,
    partial_update, update and destroy.
    """

    access_permissions = PosterAccessPermissions()
    queryset = Poster.objects.all()

    def check_view_permissions(self):
        """
        Returns True if the user has required permissions.
        """
        if self.action in ("list", "retrieve"):
            result = self.get_access_permissions().check_permissions(self.request.user)
        else:
            result = has_perm(self.request.user, "posters.can_manage")
        return result
