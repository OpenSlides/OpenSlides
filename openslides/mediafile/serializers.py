from openslides.utils.rest_api import serializers

from .models import Mediafile


class MediafileSerializer(serializers.HyperlinkedModelSerializer):
    """
    Serializer for mediafile.models.Mediafile objects.
    """
    filesize = serializers.SerializerMethodField()

    class Meta:
        model = Mediafile

    def get_filesize(self, mediafile):
        return mediafile.get_filesize()
