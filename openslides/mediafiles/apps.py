from typing import Any, Dict, Set

from django.apps import AppConfig

from ..utils.projector import register_projector_elements


class MediafilesAppConfig(AppConfig):
    name = 'openslides.mediafiles'
    verbose_name = 'OpenSlides Mediafiles'
    angular_site_module = True
    angular_projector_module = True

    def ready(self):
        # Import all required stuff.
        from openslides.core.signals import permission_change
        from openslides.utils.rest_api import router
        from .projector import get_projector_elements
        from .signals import get_permission_change_data
        from .views import MediafileViewSet
        from ..utils.access_permissions import required_user

        # Define projector elements.
        register_projector_elements(get_projector_elements())

        # Connect signals.
        permission_change.connect(
            get_permission_change_data,
            dispatch_uid='mediafiles_get_permission_change_data')

        # Register viewsets.
        router.register(self.get_model('Mediafile').get_collection_string(), MediafileViewSet)

        # register required_users
        required_user.add_collection_string(self.get_model('Mediafile').get_collection_string(), required_users)

    def get_startup_elements(self):
        """
        Yields all Cachables required on startup i. e. opening the websocket
        connection.
        """
        yield self.get_model('Mediafile')


def required_users(element: Dict[str, Any]) -> Set[int]:
    """
    Returns all user ids that are displayed as uploaders in any mediafile
    if request_user can see mediafiles. This function may return an empty
    set.
    """
    return set(element['uploader_id'])
