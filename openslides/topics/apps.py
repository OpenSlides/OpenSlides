from django.apps import AppConfig


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
        from ..utils.collection import Collection
        return [Collection(self.get_model('Topic').get_collection_string())]
