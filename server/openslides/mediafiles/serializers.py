from django.conf import settings

from ..utils.auth import get_group_model
from ..utils.rest_api import (
    CharField,
    IdPrimaryKeyRelatedField,
    JSONField,
    ModelSerializer,
    SerializerMethodField,
    ValidationError,
)
from .models import Mediafile


class MediafileSerializer(ModelSerializer):
    """
    Serializer for mediafile.models.Mediafile objects.
    """

    media_url_prefix = SerializerMethodField()
    pdf_information = JSONField(required=False)
    access_groups = IdPrimaryKeyRelatedField(
        many=True, required=False, queryset=get_group_model().objects.all()
    )
    original_filename = CharField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Mediafile
        fields = (
            "id",
            "title",
            "original_filename",
            "media_url_prefix",
            "filesize",
            "mimetype",
            "pdf_information",
            "access_groups",
            "create_timestamp",
            "is_directory",
            "path",
            "parent",
            "list_of_speakers_id",
            "inherited_access_groups_id",
        )

        read_only_fields = ("path", "filesize", "mimetype", "pdf_information")

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

    def get_media_url_prefix(self, mediafile):
        return settings.MEDIA_URL
