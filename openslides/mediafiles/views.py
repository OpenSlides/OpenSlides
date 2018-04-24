from django.http import HttpResponseForbidden, HttpResponseNotFound
from django.views.static import serve

from ..utils.auth import has_perm
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
        if self.action in ('list', 'retrieve'):
            result = self.get_access_permissions().check_permissions(self.request.user)
        elif self.action == 'metadata':
            result = has_perm(self.request.user, 'mediafiles.can_see')
        elif self.action == 'create':
            result = (has_perm(self.request.user, 'mediafiles.can_see') and
                      has_perm(self.request.user, 'mediafiles.can_upload'))
        elif self.action in ('partial_update', 'update'):
            result = (has_perm(self.request.user, 'mediafiles.can_see') and
                      has_perm(self.request.user, 'mediafiles.can_upload') and
                      has_perm(self.request.user, 'mediafiles.can_manage'))
        elif self.action == 'destroy':
            result = (has_perm(self.request.user, 'mediafiles.can_see') and
                      has_perm(self.request.user, 'mediafiles.can_manage'))
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
                not has_perm(request.user, 'mediafiles.can_manage') and
                str(self.request.user.pk) != str(uploader_id)):
            self.permission_denied(request)
        if not self.request.data.get('mediafile'):
            raise ValidationError({'detail': 'You forgot to provide a file.'})
        return super().create(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """
        Customized view endpoint to delete uploaded files.

        Does also delete the file from filesystem.
        """
        # To avoid Django calling save() and triggering autoupdate we do not
        # use the builtin method mediafile.mediafile.delete() but call
        # mediafile.mediafile.storage.delete(...) directly. This may have
        # unattended side effects so be careful especially when accessing files
        # on server via Django methods (file, open(), save(), ...).
        mediafile = self.get_object()
        mediafile.mediafile.storage.delete(mediafile.mediafile.name)
        return super().destroy(request, *args, **kwargs)


def protected_serve(request, path, document_root=None, show_indexes=False):
    try:
        mediafile = Mediafile.objects.get(mediafile=path)
    except Mediafile.DoesNotExist:
        return HttpResponseNotFound(content="Not found.")

    can_see = has_perm(request.user, 'mediafiles.can_see')
    is_special_file = mediafile.is_logo() or mediafile.is_font()
    is_hidden_but_no_perms = mediafile.hidden and not has_perm(request.user, 'mediafiles.can_see_hidden')

    if not is_special_file and (not can_see or is_hidden_but_no_perms):
        return HttpResponseForbidden(content="Forbidden.")
    else:
        return serve(request, path, document_root, show_indexes)
