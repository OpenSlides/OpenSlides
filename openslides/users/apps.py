from django.apps import AppConfig

from ..utils.collection import Collection


class UsersAppConfig(AppConfig):
    name = 'openslides.users'
    verbose_name = 'OpenSlides Users'
    angular_site_module = True
    angular_projector_module = True

    def ready(self):
        # Load projector elements.
        # Just import this file.
        from . import projector  # noqa

        # Import all required stuff.
        from ..core.config import config
        from ..core.signals import post_permission_creation, permission_change
        from ..utils.rest_api import router
        from .config_variables import get_config_variables
        from .signals import create_builtin_groups_and_admin, get_permission_change_data
        from .views import GroupViewSet, UserViewSet

        # Define config variables
        config.update_config_variables(get_config_variables())

        # Connect signals.
        post_permission_creation.connect(
            create_builtin_groups_and_admin,
            dispatch_uid='create_builtin_groups_and_admin')
        permission_change.connect(
            get_permission_change_data,
            dispatch_uid='users_get_permission_change_data')

        # Register viewsets.
        router.register(self.get_model('User').get_collection_string(), UserViewSet)
        router.register(self.get_model('Group').get_collection_string(), GroupViewSet)

    def get_startup_elements(self):
        """
        Yields all collections required on startup i. e. opening the websocket
        connection.
        """
        for model in ('User', 'Group'):
            yield Collection(self.get_model(model).get_collection_string())
