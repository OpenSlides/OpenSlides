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

    read_groups = IdPrimaryKeyRelatedField(
        many=True, required=False, queryset=get_group_model().objects.all()
    )
    write_groups = IdPrimaryKeyRelatedField(
        many=True, required=False, queryset=get_group_model().objects.all()
    )

    class Meta:
        model = ChatGroup
        fields = (
            "id",
            "name",
            "read_groups",
            "write_groups",
        )


class ChatMessageSerializer(ModelSerializer):
    """
    Serializer for chat.models.ChatMessage objects.
    """

    chatgroup = IdPrimaryKeyRelatedField(
        required=False, queryset=ChatGroup.objects.all()
    )
    read_groups_id = SerializerMethodField()
    write_groups_id = SerializerMethodField()

    class Meta:
        model = ChatMessage
        fields = (
            "id",
            "text",
            "chatgroup",
            "timestamp",
            "username",
            "user_id",
            "read_groups_id",
            "write_groups_id",
        )
        read_only_fields = (
            "username",
            "user_id",
        )

    def validate(self, data):
        if "text" in data:
            data["text"] = validate_html_strict(data["text"])
        return data

    def get_read_groups_id(self, chatmessage):
        return [group.id for group in chatmessage.chatgroup.read_groups.all()]

    def get_write_groups_id(self, chatmessage):
        return [group.id for group in chatmessage.chatgroup.write_groups.all()]
