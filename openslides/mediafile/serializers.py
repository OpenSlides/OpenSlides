from openslides.utils.rest_api import serializers

from .models import Mediafile


class MediafileSerializer(serializers.ModelSerializer):
    """
    Serializer for mediafile.models.Mediafile objects.
    """
    filesize = serializers.SerializerMethodField()

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
