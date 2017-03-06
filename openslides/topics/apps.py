from django.apps import AppConfig

from ..utils.collection import Collection


class TopicsAppConfig(AppConfig):
    name = 'openslides.topics'
    verbose_name = 'OpenSlides Topics'
    angular_site_module = True
    angular_projector_module = True

    def ready(self):
        # Load projector elements.
        # Do this by just importing all from these files.
        from . import projector  # noqa

        # Import all required stuff.
        from ..utils.rest_api import router
        from .views import TopicViewSet

        # Register viewsets.
        router.register(self.get_model('Topic').get_collection_string(), TopicViewSet)

    def get_startup_elements(self):
        """
        Yields all collections required on startup i. e. opening the websocket
        connection.
        """
        yield Collection(self.get_model('Topic').get_collection_string())
