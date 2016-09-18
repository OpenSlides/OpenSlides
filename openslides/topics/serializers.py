from openslides.utils.rest_api import ModelSerializer

from .models import Topic


class TopicSerializer(ModelSerializer):
    """
    Serializer for core.models.Topic objects.
    """
    class Meta:
        model = Topic
        fields = ('id', 'title', 'text', 'attachments', 'agenda_item_id')
