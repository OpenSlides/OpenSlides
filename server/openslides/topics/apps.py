from django.apps import AppConfig


class TopicsAppConfig(AppConfig):
    name = "openslides.topics"
    verbose_name = "OpenSlides Topics"

    def ready(self):
        # Import all required stuff.
        from openslides.core.signals import permission_change

        from ..utils.rest_api import router
        from . import serializers  # noqa
        from .projector import register_projector_slides
        from .signals import get_permission_change_data
        from .views import TopicViewSet

        # Define projector elements.
        register_projector_slides()

        # Connect signals.
        permission_change.connect(
            get_permission_change_data, dispatch_uid="topics_get_permission_change_data"
        )

        # Register viewsets.
        router.register(self.get_model("Topic").get_collection_string(), TopicViewSet)

    def get_startup_elements(self):
        """
        Yields all Cachables required on startup i. e. opening the websocket
        connection.
        """
        yield self.get_model("Topic")
