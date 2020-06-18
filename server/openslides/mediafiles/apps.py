from django.apps import AppConfig
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured


class MediafilesAppConfig(AppConfig):
    name = "openslides.mediafiles"
    verbose_name = "OpenSlides Mediafiles"

    def ready(self):
        # Import all required stuff.
        from openslides.core.signals import permission_change
        from openslides.utils.rest_api import router

        from . import serializers  # noqa
        from .projector import register_projector_slides
        from .signals import get_permission_change_data
        from .views import MediafileViewSet

        # Validate, that the media_url is correct formatted:
        # Must begin and end with a slash. It has to be at least "/".
        media_url = settings.MEDIA_URL
        if not media_url.startswith("/") or not media_url.endswith("/"):
            raise ImproperlyConfigured(
                "The MEDIA_URL setting must start and end with a slash"
            )

        # Define projector elements.
        register_projector_slides()

        # Connect signals.
        permission_change.connect(
            get_permission_change_data,
            dispatch_uid="mediafiles_get_permission_change_data",
        )

        # Register viewsets.
        router.register(
            self.get_model("Mediafile").get_collection_string(), MediafileViewSet
        )

    def get_startup_elements(self):
        """
        Yields all Cachables required on startup i. e. opening the websocket
        connection.
        """
        yield self.get_model("Mediafile")
