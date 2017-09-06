from django.apps import AppConfig

from ..utils.collection import Collection
from ..utils.projector import register_projector_elements


class AgendaAppConfig(AppConfig):
    name = 'openslides.agenda'
    verbose_name = 'OpenSlides Agenda'
    angular_site_module = True
    angular_projector_module = True

    def ready(self):
        # Import all required stuff.
        from django.db.models.signals import pre_delete, post_save
        from ..core.config import config
        from ..core.signals import permission_change, user_data_required
        from ..utils.rest_api import router
        from .config_variables import get_config_variables
        from .projector import get_projector_elements
        from .signals import (
            get_permission_change_data,
            listen_to_related_object_post_delete,
            listen_to_related_object_post_save,
            required_users)
        from .views import ItemViewSet

        # Define config variables and projector elements.
        config.update_config_variables(get_config_variables())
        register_projector_elements(get_projector_elements())

        # Connect signals.
        post_save.connect(
            listen_to_related_object_post_save,
            dispatch_uid='listen_to_related_object_post_save')
        pre_delete.connect(
            listen_to_related_object_post_delete,
            dispatch_uid='listen_to_related_object_post_delete')
        permission_change.connect(
            get_permission_change_data,
            dispatch_uid='agenda_get_permission_change_data')
        user_data_required.connect(
            required_users,
            dispatch_uid='agenda_required_users')

        # Register viewsets.
        router.register(self.get_model('Item').get_collection_string(), ItemViewSet)

    def get_startup_elements(self):
        """
        Yields all collections required on startup i. e. opening the websocket
        connection.
        """
        yield Collection(self.get_model('Item').get_collection_string())
