from django.conf import settings
from django.contrib.auth.models import AnonymousUser
from rest_framework.utils.serializer_helpers import ReturnDict

from openslides.utils.auth import has_perm
from openslides.utils.autoupdate import (
    disable_history,
    inform_changed_data,
    inform_deleted_data,
)
from openslides.utils.rest_api import (
    CreateModelMixin,
    DestroyModelMixin,
    GenericViewSet,
    ModelViewSet,
    Response,
    action,
    status,
)

from .models import ChatGroup, ChatMessage


ENABLE_CHAT = getattr(settings, "ENABLE_CHAT", False)


class ChatGroupViewSet(ModelViewSet):
    """
    API endpoint for chat groups.

    There are the following views: metadata, list, retrieve, create,
    partial_update, update, destroy and clear.
    """

    queryset = ChatGroup.objects.all()

    def check_view_permissions(self):
        """
        Returns True if the user has required permissions.
        """
        if self.action in ("list", "retrieve"):
            result = True
        else:
            result = has_perm(self.request.user, "chat.can_manage")

        return result and ENABLE_CHAT

    def update(self, *args, **kwargs):
        response = super().update(*args, **kwargs)
        # Update all affected chatmessages to update their `read_groups_id`  and
        # `write_groups_id` field, which is taken from the updated chatgroup.
        inform_changed_data(ChatMessage.objects.filter(chatgroup=self.get_object()))
        return response

    @action(detail=True, methods=["POST"])
    def clear(self, request, *args, **kwargs):
        """
        Deletes all chat messages of the group.
        """
        messages = self.get_object().messages.all()
        messages_id = [message.id for message in messages]
        messages.delete()
        collection = ChatMessage.get_collection_string()
        inform_deleted_data((collection, id) for id in messages_id)
        return Response()


class ChatMessageViewSet(
    CreateModelMixin,
    DestroyModelMixin,
    GenericViewSet,
):
    """
    API endpoint for chat groups.

    There are the following views: metadata, list, retrieve, create
    """

    queryset = ChatMessage.objects.all()

    def check_view_permissions(self):
        # The permissions are checked in the view.
        return ENABLE_CHAT and not isinstance(self.request.user, AnonymousUser)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if not serializer.validated_data["chatgroup"].can_write(self.request.user):
            self.permission_denied(self.request)

        # Do not use the serializer.save since it will put the model in the history.
        validated_data = {
            **serializer.validated_data,
            "username": self.request.user.short_name(),
            "user_id": self.request.user.id,
        }
        chatmessage = ChatMessage(**validated_data)
        chatmessage.save(disable_history=True)

        return Response(
            ReturnDict(id=chatmessage.id, serializer=serializer),
            status=status.HTTP_201_CREATED,
        )

    def destroy(self, request, *args, **kwargs):
        if (
            not has_perm(self.request.user, "chat.can_manage")
            and self.get_object().user_id != self.request.user.id
        ):
            self.permission_denied(request)

        disable_history()

        return super().destroy(request, *args, **kwargs)
