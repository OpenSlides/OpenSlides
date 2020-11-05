from openslides.posters.models import Poster
from openslides.utils.rest_api import ModelSerializer


class PosterSerializer(ModelSerializer):
    """
    Serializer for core.models.Poster objects.
    """

    class Meta:
        model = Poster
        fields = (
            "id",
            "title",
            "xml",
            "published",
            "list_of_speakers_id",
        )
