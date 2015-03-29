from openslides.utils.rest_api import ModelSerializer, SerializerMethodField

from .models import Mediafile


class MediafileSerializer(ModelSerializer):
    """
    Serializer for mediafile.models.Mediafile objects.
    """
    filesize = SerializerMethodField()

    class Meta:
        model = Mediafile
        fields = (
            'id',
            'title',
            'mediafile',
            'uploader',
            'filesize',
            'filetype',
            'timestamp',
            'is_presentable',)

    def get_filesize(self, mediafile):
        return mediafile.get_filesize()
