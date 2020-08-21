import json

from django.conf import settings
from django.db import connections
from django.http import HttpResponseForbidden, HttpResponseNotFound, JsonResponse
from django.http.request import QueryDict
from django.views.decorators.csrf import csrf_exempt
from django.views.static import serve

from openslides.core.models import Projector
from openslides.utils import logging
from openslides.utils.auth import has_perm, in_some_groups
from openslides.utils.autoupdate import inform_changed_data
from openslides.utils.rest_api import (
    ModelViewSet,
    Response,
    ValidationError,
    list_route,
    status,
)

from .access_permissions import MediafileAccessPermissions
from .config import watch_and_update_configs
from .models import Mediafile
from .utils import bytes_to_human, get_pdf_information


logger = logging.getLogger(__name__)

use_mediafile_database = "mediafiles" in connections
if use_mediafile_database:
    logger.info("Using a standalone mediafile database")

max_upload_size = getattr(
    settings, "MEDIAFILE_MAX_SIZE", 100 * 1024 * 1024
)  # default: 100mb


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
        if self.action in ("list", "retrieve", "metadata"):
            result = self.get_access_permissions().check_permissions(self.request.user)
        elif self.action in (
            "create",
            "partial_update",
            "update",
            "move",
            "destroy",
            "bulk_delete",
        ):
            result = has_perm(self.request.user, "mediafiles.can_see") and has_perm(
                self.request.user, "mediafiles.can_manage"
            )
        else:
            result = False
        return result

    def convert_access_groups(self, request):
        # convert formdata json representation of "[id, id, ...]" to an real object
        if "access_groups_id" in request.data and isinstance(request.data, QueryDict):
            access_groups_id = request.data.get("access_groups_id")
            if access_groups_id:
                try:
                    access_groups_id = json.loads(access_groups_id)
                    request.data.setlist("access_groups_id", access_groups_id)
                except json.decoder.JSONDecodeError:
                    raise ValidationError(
                        {
                            "detail": "The provided access groups ({access_groups_id}) is not JSON"
                        }
                    )
            else:
                del request.data["access_groups_id"]

    def create(self, request, *args, **kwargs):
        """
        Customized view endpoint to upload a new file.
        """
        # The form data may send the groups_id
        if isinstance(request.data, QueryDict):
            request.data._mutable = True

        self.convert_access_groups(request)

        is_directory = bool(request.data.get("is_directory", False))
        mediafile = request.data.get("mediafile")

        # Check, that it is either a file or a directory
        if is_directory and mediafile:
            raise ValidationError(
                {"detail": "Either create a path or a file, but not both"}
            )
        if not mediafile and not is_directory:
            raise ValidationError({"detail": "You forgot to provide a file."})

        if mediafile:
            if mediafile.size > max_upload_size:
                max_size_for_humans = bytes_to_human(max_upload_size)
                raise ValidationError(
                    {"detail": f"The maximum upload file size is {max_size_for_humans}"}
                )

            # set original filename
            request.data["original_filename"] = mediafile.name

            # Remove mediafile from request.data, we will put it into the storage ourself.
            request.data.pop("mediafile", None)

        # Create mediafile
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        db_mediafile = serializer.save()

        # Set filesize, mimetype and check for pdfs.
        if mediafile:
            db_mediafile.filesize = bytes_to_human(mediafile.size)
            db_mediafile.mimetype = mediafile.content_type
            if db_mediafile.mimetype == "application/pdf":
                db_mediafile.pdf_information = get_pdf_information(mediafile)
            else:
                db_mediafile.pdf_information = {}
            db_mediafile.save()

            # Custom modifications for the database storage: Set original filename here and
            # insert the file into the foreing storage
            if use_mediafile_database:
                with connections["mediafiles"].cursor() as cursor:
                    cursor.execute(
                        "INSERT INTO mediafile_data (id, data, mimetype) VALUES (%s, %s, %s)",
                        [
                            db_mediafile.id,
                            mediafile.open().read(),
                            mediafile.content_type,
                        ],
                    )
            else:
                db_mediafile.mediafile = mediafile
                db_mediafile.save()

        return Response(data={"id": db_mediafile.id}, status=status.HTTP_201_CREATED)

    def destroy(self, *args, **kwargs):
        with watch_and_update_configs():
            mediafile = self.get_object()
            deleted_ids = mediafile.delete()
            if use_mediafile_database:
                with connections["mediafiles"].cursor() as cursor:
                    cursor.execute(
                        "DELETE FROM mediafile_data WHERE id IN %s",
                        [tuple(id for id in deleted_ids)],
                    )

        return Response(status=status.HTTP_204_NO_CONTENT)

    def update(self, *args, **kwargs):
        with watch_and_update_configs():
            response = super().update(*args, **kwargs)
        inform_changed_data(self.get_object().get_children_deep())
        return response

    @list_route(methods=["post"])
    def move(self, request):
        """
        {
            ids: [<id>, <id>, ...],
            directory_id: <id>
        }
        Move <ids> to the given directory_id. This will raise an error, if
        the move would be recursive.
        """

        # Validate data:
        if not isinstance(request.data, dict):
            raise ValidationError({"detail": "The data must be a dict"})
        ids = request.data.get("ids")
        if not isinstance(ids, list):
            raise ValidationError({"detail": "The ids must be a list"})
        for id in ids:
            if not isinstance(id, int):
                raise ValidationError({"detail": "All ids must be an int"})
        directory_id = request.data.get("directory_id")
        if directory_id is not None and not isinstance(directory_id, int):
            raise ValidationError({"detail": "The directory_id must be an int"})
        if directory_id is None:
            directory = None
        else:
            try:
                directory = Mediafile.objects.get(pk=directory_id, is_directory=True)
            except Mediafile.DoesNotExist:
                raise ValidationError({"detail": "The directory does not exist"})

        ids_set = set(ids)  # keep them in a set for fast lookup
        ids = list(ids_set)  # make ids unique

        mediafiles = []
        for id in ids:
            try:
                mediafiles.append(Mediafile.objects.get(pk=id))
            except Mediafile.DoesNotExist:
                raise ValidationError(
                    {"detail": "The mediafile with id {0} does not exist", "args": [id]}
                )

        # Search for valid parents (None is not included, but also safe!)
        if directory is not None:
            valid_parent_ids = set()

            queue = list(Mediafile.objects.filter(parent=None, is_directory=True))
            for mediafile in queue:
                if mediafile.pk in ids_set:
                    continue  # not valid, because this is in the input data
                valid_parent_ids.add(mediafile.pk)
                queue.extend(
                    list(Mediafile.objects.filter(parent=mediafile, is_directory=True))
                )

            if directory_id not in valid_parent_ids:
                raise ValidationError({"detail": "The directory is not valid"})

        # Ok, update all mediafiles
        with watch_and_update_configs():
            for mediafile in mediafiles:
                mediafile.parent = directory
                mediafile.save(skip_autoupdate=True)
        if directory is None:
            inform_changed_data(Mediafile.objects.all())
        else:
            inform_changed_data(directory.get_children_deep())

        return Response()

    @list_route(methods=["post"])
    def bulk_delete(self, request):
        """
        Deletes mediafiles *from one directory*. Expected data:
        { ids: [<id>, <id>, ...] }
        It is checked, that every id belongs to the same directory.
        """
        # Validate data:
        if not isinstance(request.data, dict):
            raise ValidationError({"detail": "The data must be a dict"})
        ids = request.data.get("ids")
        if not isinstance(ids, list):
            raise ValidationError({"detail": "The ids must be a list"})
        for id in ids:
            if not isinstance(id, int):
                raise ValidationError({"detail": "All ids must be an int"})

        # Get mediafiles
        mediafiles = []
        for id in ids:
            try:
                mediafiles.append(Mediafile.objects.get(pk=id))
            except Mediafile.DoesNotExist:
                raise ValidationError(
                    {"detail": "The mediafile with id {0} does not exist", "args": [id]}
                )
        if not mediafiles:
            return Response()

        # Validate, that they are in the same directory:
        directory_id = mediafiles[0].parent_id
        for mediafile in mediafiles:
            if mediafile.parent_id != directory_id:
                raise ValidationError(
                    {"detail": "All mediafiles must be in the same directory."}
                )

        with watch_and_update_configs():
            for mediafile in mediafiles:
                mediafile.delete()

        return Response()


def get_mediafile(request, path):
    """
    returnes the mediafile for the requested path and checks, if the user is
    valid to retrieve the mediafile. If not, None will be returned.
    A user must have all access permissions for all folders the the file itself,
    or the file is a special file (logo or font), then it is always returned.

    If the mediafile cannot be found,  a Mediafile.DoesNotExist will be raised.
    """
    if not path:
        raise Mediafile.DoesNotExist()
    parts = path.split("/")
    parent = None
    can_see = has_perm(request.user, "mediafiles.can_see")
    for i, part in enumerate(parts):
        is_directory = i < len(parts) - 1
        if is_directory:
            mediafile = Mediafile.objects.get(
                parent=parent, is_directory=is_directory, title=part
            )
        else:
            mediafile = Mediafile.objects.get(
                parent=parent, is_directory=is_directory, original_filename=part
            )
        if mediafile.access_groups.exists() and not in_some_groups(
            request.user.id, [group.id for group in mediafile.access_groups.all()]
        ):
            can_see = False
        parent = mediafile

    # Check, if this file is projected
    is_projected = False
    for projector in Projector.objects.all():
        for element in projector.elements:
            name = element.get("name")
            id = element.get("id")
            if name == "mediafiles/mediafile" and id == mediafile.id:
                is_projected = True
                break

    if not can_see and not mediafile.is_special_file and not is_projected:
        mediafile = None

    return mediafile


def protected_serve(request, path, document_root=None, show_indexes=False):
    try:
        mediafile = get_mediafile(request, path)
    except Mediafile.DoesNotExist:
        return HttpResponseNotFound(content="Not found.")

    if mediafile:
        return serve(request, mediafile.mediafile.name, document_root, show_indexes)
    else:
        return HttpResponseForbidden(content="Forbidden.")


@csrf_exempt
def check_serve(request, path):
    """
    Checks, if the mediafile could be delivered: Responds with a 403 if the access is
    forbidden *or* the file was not found. Responds 200 with the mediafile id, if
    the access is granted.
    """
    try:
        mediafile = get_mediafile(request, path)
        if not mediafile:
            raise Mediafile.DoesNotExist()
    except Mediafile.DoesNotExist:
        return HttpResponseForbidden()
    return JsonResponse({"id": mediafile.id})
