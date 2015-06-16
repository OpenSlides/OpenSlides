from openslides.utils.rest_api import ModelViewSet

from .models import Mediafile
from .serializers import MediafileSerializer


class MediafileViewSet(ModelViewSet):
    """
    API endpoint to list, retrieve, create, update and destroy mediafile
    objects.
    """
    queryset = Mediafile.objects.all()
    serializer_class = MediafileSerializer

    def check_permissions(self, request):
        """
        Calls self.permission_denied() if the requesting user has not the
        permission to see mediafile objects and in case of create, update or
        destroy requests the permission to manage mediafile objects.
        """
        # TODO: Use mediafiles.can_upload permission to create and update some
        #       objects but restricted concerning the uploader.
        if (not request.user.has_perm('mediafiles.can_see') or
                (self.action in ('create', 'update', 'destroy') and not
                 request.user.has_perm('mediafiles.can_manage'))):
            self.permission_denied(request)
