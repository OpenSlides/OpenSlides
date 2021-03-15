from django.conf import settings
from django.db import models

from openslides.utils.manager import BaseManager

from ..utils.auth import has_perm, in_some_groups
from ..utils.models import CASCADE_AND_AUTOUPDATE, RESTModelMixin


class ChatGroupManager(BaseManager):
    """
    Customized model manager to support our get_prefetched_queryset method.
    """

    def get_prefetched_queryset(self, *args, **kwargs):
        return (
            super()
            .get_prefetched_queryset(*args, **kwargs)
            .prefetch_related("read_groups", "write_groups")
        )


class ChatGroup(RESTModelMixin, models.Model):
    objects = ChatGroupManager()

    name = models.CharField(max_length=256)
    read_groups = models.ManyToManyField(
        settings.AUTH_GROUP_MODEL, blank=True, related_name="chat_read_groups"
    )
    write_groups = models.ManyToManyField(
        settings.AUTH_GROUP_MODEL, blank=True, related_name="chat_write_groups"
    )

    class Meta:
        default_permissions = ()
        permissions = (("can_manage", "Can manage chat"),)

    def __str__(self):
        return self.name

    def can_write(self, user):
        if has_perm(user.id, "chat.can_manage"):
            return True

        return in_some_groups(user.id, self.write_groups.values_list(flat=True))


class ChatMessageManager(BaseManager):
    """
    Customized model manager to support our get_prefetched_queryset method.
    """

    def get_prefetched_queryset(self, *args, **kwargs):
        return (
            super()
            .get_prefetched_queryset(*args, **kwargs)
            .prefetch_related(
                "chatgroup", "chatgroup__read_groups", "chatgroup__write_groups"
            )
        )


class ChatMessage(RESTModelMixin, models.Model):
    objects = ChatMessageManager()

    text = models.CharField(max_length=512)
    timestamp = models.DateTimeField(auto_now_add=True)
    chatgroup = models.ForeignKey(
        ChatGroup, on_delete=CASCADE_AND_AUTOUPDATE, related_name="messages"
    )
    username = models.CharField(max_length=256)
    user_id = models.IntegerField()

    class Meta:
        default_permissions = ()

    def __str__(self):
        return f"{self.username} ({self.timestamp}): {self.text}"
