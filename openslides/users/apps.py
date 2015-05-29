from django.apps import AppConfig


class UsersAppConfig(AppConfig):
    name = 'openslides.users'
    verbose_name = 'OpenSlides Users'

    def ready(self):
        # Load main menu entry and widgets.
        # Do this by just importing all from these files.
        from . import main_menu, projector, widgets  # noqa

        # Import all required stuff.
        from openslides.config.signals import config_signal
        from openslides.core.signals import post_permission_creation
        from openslides.utils.rest_api import router
        from .signals import create_builtin_groups_and_admin, setup_users_config
        from .views import GroupViewSet, UserViewSet

        # Connect signals.
        config_signal.connect(
            setup_users_config,
            dispatch_uid='setup_users_config')
        post_permission_creation.connect(
            create_builtin_groups_and_admin,
            dispatch_uid='create_builtin_groups_and_admin')

        # Register viewsets.
        router.register('users/user', UserViewSet)
        router.register('users/group', GroupViewSet)
