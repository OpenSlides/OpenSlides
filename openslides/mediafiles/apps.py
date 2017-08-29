from django.apps import AppConfig

from ..utils.collection import Collection
from ..utils.projector import register_projector_elements


class MediafilesAppConfig(AppConfig):
    name = 'openslides.mediafiles'
    verbose_name = 'OpenSlides Mediafiles'
    angular_site_module = True
    angular_projector_module = True

    def ready(self):
        # Import all required stuff.
        from openslides.core.signals import permission_change, user_data_required
        from openslides.utils.rest_api import router
        from .projector import get_projector_elements
        from .signals import get_permission_change_data, required_users
        from .views import MediafileViewSet

        # Define projector elements.
        register_projector_elements(get_projector_elements())

        # Connect signals.
        permission_change.connect(
            get_permission_change_data,
            dispatch_uid='mediafiles_get_permission_change_data')
        user_data_required.connect(
            required_users,
            dispatch_uid='mediafiles_required_users')

        # Register viewsets.
        router.register(self.get_model('Mediafile').get_collection_string(), MediafileViewSet)

    def get_startup_elements(self):
        """
        Yields all collections required on startup i. e. opening the websocket
        connection.
        """
        yield Collection(self.get_model('Mediafile').get_collection_string())
