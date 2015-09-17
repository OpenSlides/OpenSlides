from ..utils.rest_api import ModelViewSet
from .models import Mediafile
from .serializers import MediafileSerializer


# Viewsets for the REST API

class MediafileViewSet(ModelViewSet):
    """
    API endpoint for mediafile objects.

    There are the following views: metadata, list, retrieve, create,
    partial_update, update and destroy.
    """
    queryset = Mediafile.objects.all()
    serializer_class = MediafileSerializer

    def check_view_permissions(self):
        """
        Returns True if the user has required permissions.
        """
        # TODO: Use mediafiles.can_upload permission to create and update some
        #       objects but restricted concerning the uploader.
        if self.action in ('metadata', 'list', 'retrieve'):
            result = self.request.user.has_perm('mediafiles.can_see')
        elif self.action in ('create', 'partial_update', 'update'):
            result = (self.request.user.has_perm('mediafiles.can_see') and
                      self.request.user.has_perm('mediafiles.can_upload') and
                      self.request.user.has_perm('mediafiles.can_manage'))
        elif self.action == 'destroy':
            result = (self.request.user.has_perm('mediafiles.can_see') and
                      self.request.user.has_perm('mediafiles.can_manage'))
        else:
            result = False
        return result
