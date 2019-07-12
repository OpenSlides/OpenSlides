import mimetypes

from django.conf import settings
from django.db import models as dbmodels
from PyPDF2 import PdfFileReader
from PyPDF2.utils import PdfReadError

from ..utils.auth import get_group_model
from ..utils.rest_api import (
    FileField,
    IdPrimaryKeyRelatedField,
    ModelSerializer,
    SerializerMethodField,
    ValidationError,
)
from .models import Mediafile


class AngularCompatibleFileField(FileField):
    def to_internal_value(self, data):
        if data == "":
            return None
        return super(AngularCompatibleFileField, self).to_internal_value(data)

    def to_representation(self, value):
        if value is None or value.name is None:
            return None
        filetype = mimetypes.guess_type(value.name)[0]
        result = {"name": value.name, "type": filetype}
        if filetype == "application/pdf":
            try:
                if (
                    settings.DEFAULT_FILE_STORAGE
                    == "storages.backends.sftpstorage.SFTPStorage"
                ):
                    remote_path = value.storage._remote_path(value.name)
                    file_handle = value.storage.sftp.open(remote_path, mode="rb")
                else:
                    file_handle = open(value.path, "rb")

                result["pages"] = PdfFileReader(file_handle).getNumPages()
            except FileNotFoundError:
                # File was deleted from server. Set 'pages' to 0.
                result["pages"] = 0
            except PdfReadError:
                # File could be encrypted but not be detected by PyPDF.
                result["pages"] = 0
                result["encrypted"] = True
        return result


class MediafileSerializer(ModelSerializer):
    """
    Serializer for mediafile.models.Mediafile objects.
    """

    media_url_prefix = SerializerMethodField()
    filesize = SerializerMethodField()
    access_groups = IdPrimaryKeyRelatedField(
        many=True, required=False, queryset=get_group_model().objects.all()
    )

    def __init__(self, *args, **kwargs):
        """
        This constructor overwrites the FileField field serializer to return the file meta data in a way that the
        angualarjs upload module likes
        """
        super(MediafileSerializer, self).__init__(*args, **kwargs)
        self.serializer_field_mapping[dbmodels.FileField] = AngularCompatibleFileField

        # Make some fields read-oinly for updates (not creation)
        if self.instance is not None:
            self.fields["mediafile"].read_only = True

    class Meta:
        model = Mediafile
        fields = (
            "id",
            "title",
            "mediafile",
            "media_url_prefix",
            "filesize",
            "access_groups",
            "create_timestamp",
            "is_directory",
            "path",
            "parent",
            "list_of_speakers_id",
            "inherited_access_groups_id",
        )

        read_only_fields = ("path",)

    def validate(self, data):
        title = data.get("title")
        if title is not None and not title:
            raise ValidationError({"detail": "The title must not be empty"})

        parent = data.get("parent")
        if parent and not parent.is_directory:
            raise ValidationError({"detail": "parent must be a directory."})

        if data.get("is_directory") and "/" in data.get("title", ""):
            raise ValidationError(
                {"detail": 'The name contains invalid characters: "/"'}
            )

        return super().validate(data)

    def create(self, validated_data):
        access_groups = validated_data.pop("access_groups", [])
        mediafile = super().create(validated_data)
        mediafile.access_groups.set(access_groups)
        mediafile.save()
        return mediafile

    def update(self, instance, validated_data):
        # remove is_directory, create_timestamp and parent from validated_data
        # to prevent updating them (mediafile is ensured in the constructor)
        validated_data.pop("is_directory", None)
        validated_data.pop("create_timestamp", None)
        validated_data.pop("parent", None)
        return super().update(instance, validated_data)

    def get_filesize(self, mediafile):
        return mediafile.get_filesize()

    def get_media_url_prefix(self, mediafile):
        return settings.MEDIA_URL
