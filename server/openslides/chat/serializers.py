from openslides.utils.rest_api import (
    IdPrimaryKeyRelatedField,
    ModelSerializer,
    SerializerMethodField,
)
from openslides.utils.validate import validate_html_strict

from ..utils.auth import get_group_model
from .models import ChatGroup, ChatMessage


class ChatGroupSerializer(ModelSerializer):
    """
    Serializer for chat.models.ChatGroup objects.
    """

    access_groups = IdPrimaryKeyRelatedField(
        many=True, required=False, queryset=get_group_model().objects.all()
    )

    class Meta:
        model = ChatGroup
        fields = (
            "id",
            "name",
            "access_groups",
        )


class ChatMessageSerializer(ModelSerializer):
    """
    Serializer for chat.models.ChatMessage objects.
    """

    chatgroup = IdPrimaryKeyRelatedField(
        required=False, queryset=ChatGroup.objects.all()
    )
    access_groups_id = SerializerMethodField()

    class Meta:
        model = ChatMessage
        fields = (
            "id",
            "text",
            "chatgroup",
            "timestamp",
            "username",
            "access_groups_id",
        )
        read_only_fields = ("username",)

    def validate(self, data):
        if "text" in data:
            data["text"] = validate_html_strict(data["text"])
        return data

    def get_access_groups_id(self, chatmessage):
        return [group.id for group in chatmessage.chatgroup.access_groups.all()]
