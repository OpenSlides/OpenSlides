from ..utils.rest_api import ModelViewSet, ValidationError
from .access_permissions import MediafileAccessPermissions
from .models import Mediafile


# Viewsets for the REST API

class MediafileViewSet(ModelViewSet):
    """
    API endpoint for mediafile objects.

    There are the following views: metadata, list, retrieve, create,
    partial_update, update and destroy.
    """
    access_permissions = MediafileAccessPermissions()
    queryset = Mediafile.objects.all()

    def check_view_permissions(self):
        """
        Returns True if the user has required permissions.
        """
        if self.action == 'retrieve':
            result = self.get_access_permissions().can_retrieve(self.request.user)
        elif self.action in ('metadata', 'list'):
            result = self.request.user.has_perm('mediafiles.can_see')
        elif self.action == 'create':
            result = (self.request.user.has_perm('mediafiles.can_see') and
                      self.request.user.has_perm('mediafiles.can_upload'))
        elif self.action in ('partial_update', 'update'):
            result = (self.request.user.has_perm('mediafiles.can_see') and
                      self.request.user.has_perm('mediafiles.can_upload') and
                      self.request.user.has_perm('mediafiles.can_manage'))
        elif self.action == 'destroy':
            result = (self.request.user.has_perm('mediafiles.can_see') and
                      self.request.user.has_perm('mediafiles.can_manage'))
        else:
            result = False
        return result

    def create(self, request, *args, **kwargs):
        """
        Customized view endpoint to upload a new file.
        """
        # Check permission to check if the uploader has to be changed.
        uploader_id = self.request.data.get('uploader_id')
        if (uploader_id and
                not request.user.has_perm('mediafiles.can_manage') and
                str(self.request.user.pk) != str(uploader_id)):
            self.permission_denied(request)
        if not self.request.data.get('mediafile'):
            raise ValidationError({'detail': 'You forgot to provide a file.'})
        return super().create(request, *args, **kwargs)
