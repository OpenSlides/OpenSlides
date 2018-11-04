from django.apps import AppConfig
from django.conf import settings
from django.contrib.auth.signals import user_logged_in
from ..utils.projector import register_projector_elements


class UsersAppConfig(AppConfig):
    name = 'openslides.users'
    verbose_name = 'OpenSlides Users'
    angular_site_module = True
    angular_projector_module = True

    def ready(self):
        # Import all required stuff.
        from ..core.signals import permission_change
        from ..utils.rest_api import router
        from .projector import get_projector_elements
        from .signals import get_permission_change_data
        from .views import GroupViewSet, PersonalNoteViewSet, UserViewSet

        # Define projector elements.
        register_projector_elements(get_projector_elements())

        # Connect signals.
        permission_change.connect(
            get_permission_change_data,
            dispatch_uid='users_get_permission_change_data')

        # Disconnect the last_login signal
        if not settings.ENABLE_LAST_LOGIN_FIELD:
            user_logged_in.disconnect(dispatch_uid='update_last_login')

        # Register viewsets.
        router.register(self.get_model('User').get_collection_string(), UserViewSet)
        router.register(self.get_model('Group').get_collection_string(), GroupViewSet)
        router.register(self.get_model('PersonalNote').get_collection_string(), PersonalNoteViewSet)

    def get_config_variables(self):
        from .config_variables import get_config_variables
        return get_config_variables()

    def get_startup_elements(self):
        """
        Yields all Cachables required on startup i. e. opening the websocket
        connection.
        """
        for model_name in ('User', 'Group', 'PersonalNote'):
            yield self.get_model(model_name)

    def get_angular_constants(self):
        from ..utils.auth import get_all_permissions
        #TODO
        permissions = []
        for permission in get_all_permissions():
            permissions.append({
                'display_name': permission.name,
                'value': '.'.join((permission.content_type.app_label, permission.codename,))})
        return {'permissions': permissions}
