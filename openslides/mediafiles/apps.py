from django.apps import AppConfig

from ..utils.collection import Collection


class MediafilesAppConfig(AppConfig):
    name = 'openslides.mediafiles'
    verbose_name = 'OpenSlides Mediafiles'
    angular_site_module = True
    angular_projector_module = True

    def ready(self):
        # Load projector elements.
        # Do this by just importing all from these files.
        from . import projector  # noqa

        # Import all required stuff.
        from openslides.core.signals import permission_change
        from openslides.utils.rest_api import router
        from .signals import get_permission_change_data
        from .views import MediafileViewSet

        # Connect signals.
        permission_change.connect(
            get_permission_change_data,
            dispatch_uid='mediafiles_get_permission_change_data')

        # Register viewsets.
        router.register(self.get_model('Mediafile').get_collection_string(), MediafileViewSet)

    def get_startup_elements(self):
        """
        Yields all collections required on startup i. e. opening the websocket
        connection.
        """
        yield Collection(self.get_model('Mediafile').get_collection_string())
