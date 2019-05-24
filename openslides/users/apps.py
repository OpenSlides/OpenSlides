from django.apps import AppConfig
from django.conf import settings
from django.contrib.auth.signals import user_logged_in


class UsersAppConfig(AppConfig):
    name = "openslides.users"
    verbose_name = "OpenSlides Users"

    def ready(self):
        # Import all required stuff.
        from . import serializers  # noqa
        from ..core.signals import post_permission_creation, permission_change
        from ..utils.rest_api import router
        from .projector import register_projector_slides
        from .signals import create_builtin_groups_and_admin, get_permission_change_data
        from .views import GroupViewSet, PersonalNoteViewSet, UserViewSet

        # Define projector elements.
        register_projector_slides()

        # Connect signals.
        post_permission_creation.connect(
            create_builtin_groups_and_admin,
            dispatch_uid="create_builtin_groups_and_admin",
        )
        permission_change.connect(
            get_permission_change_data, dispatch_uid="users_get_permission_change_data"
        )

        # Disconnect the last_login signal
        if not settings.ENABLE_LAST_LOGIN_FIELD:
            user_logged_in.disconnect(dispatch_uid="update_last_login")

        # Register viewsets.
        router.register(self.get_model("User").get_collection_string(), UserViewSet)
        router.register(self.get_model("Group").get_collection_string(), GroupViewSet)
        router.register(
            self.get_model("PersonalNote").get_collection_string(), PersonalNoteViewSet
        )

    def get_config_variables(self):
        from .config_variables import get_config_variables

        return get_config_variables()

    def get_startup_elements(self):
        """
        Yields all Cachables required on startup i. e. opening the websocket
        connection.
        """
        for model_name in ("User", "Group", "PersonalNote"):
            yield self.get_model(model_name)

    def get_angular_constants(self):
        from django.contrib.auth.models import Permission

        permissions = []
        for permission in Permission.objects.all():
            permissions.append(
                {
                    "display_name": permission.name,
                    "value": ".".join(
                        (permission.content_type.app_label, permission.codename)
                    ),
                }
            )
        return {"permissions": permissions}
