import mimetypes

from django.conf import settings
from django.db import models as dbmodels

from ..utils.rest_api import FileField, ModelSerializer, SerializerMethodField
from .models import Mediafile


class AngularCompatibleFileField(FileField):

    def to_internal_value(self, data):
        if data == '':
            return None
        return super(AngularCompatibleFileField, self).to_internal_value(data)

    def to_representation(self, value):
        if value is None:
            return None
        return {
            'name': value.name,
            'type': mimetypes.guess_type(value.path)[0]
        }


class MediafileSerializer(ModelSerializer):
    """
    Serializer for mediafile.models.Mediafile objects.
    """
    media_url_prefix = SerializerMethodField()
    filesize = SerializerMethodField()

    def __init__(self, *args, **kwargs):
        """
        This constructor overwrites the FileField field serializer to return the file meta data in a way that the
        angualarjs upload module likes
        """
        super(MediafileSerializer, self).__init__(*args, **kwargs)
        self.serializer_field_mapping[dbmodels.FileField] = AngularCompatibleFileField

    class Meta:
        model = Mediafile
        fields = (
            'id',
            'title',
            'mediafile',
            'media_url_prefix',
            'uploader',
            'filesize',
            'timestamp',)

    def get_filesize(self, mediafile):
        return mediafile.get_filesize()

    def get_media_url_prefix(self, mediafile):
        return settings.MEDIA_URL
