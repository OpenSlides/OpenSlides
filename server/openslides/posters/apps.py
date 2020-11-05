from django.apps import AppConfig


class PostersAppConfig(AppConfig):
    name = "openslides.posters"
    verbose_name = "OpenSlides Posters"

    def ready(self):
        # Import all required stuff.
        from openslides.core.signals import permission_change
        from openslides.utils.rest_api import router
        from openslides.posters.projector import register_projector_slides
        from openslides.posters.signals import get_permission_change_data
        from openslides.posters.views import PosterViewSet
        from openslides.posters import serializers  # noqa

        # Define projector elements.
        register_projector_slides()

        # Connect signals.
        permission_change.connect(
            get_permission_change_data,
            dispatch_uid="posters_get_permission_change_data",
        )

        # Register viewsets.
        router.register(self.get_model("Poster").get_collection_string(), PosterViewSet)

    def get_startup_elements(self):
        """
        Yields all Cachables required on startup i. e. opening the websocket
        connection.
        """
        yield self.get_model("Poster")
