from django.apps import AppConfig


class ChatAppConfig(AppConfig):
    name = "openslides.chat"
    verbose_name = "OpenSlides Chat"

    def ready(self):
        # Import all required stuff.
        from ..utils.rest_api import router
        from . import serializers  # noqa
        from .views import (
            ChatGroupViewSet,
            ChatMessageViewSet,
        )

        # Register viewsets.
        router.register(
            self.get_model("ChatGroup").get_collection_string(),
            ChatGroupViewSet,
        )
        router.register(
            self.get_model("ChatMessage").get_collection_string(), ChatMessageViewSet
        )

    def get_startup_elements(self):
        """
        Yields all Cachables required on startup i. e. opening the websocket
        connection.
        """
        yield self.get_model("ChatGroup")
        yield self.get_model("ChatMessage")
