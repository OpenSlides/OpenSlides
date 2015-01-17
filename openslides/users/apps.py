from django.apps import AppConfig


class UsersAppConfig(AppConfig):
    name = 'openslides.users'
    verbose_name = 'OpenSlides Users'

    def ready(self):
        # Load main menu entry and widgets.
        # Do this by just importing all from these files.
        from . import main_menu, widgets  # noqa

        # Import all required stuff.
        from django.db.models.signals import post_save
        from openslides.config.signals import config_signal
        from openslides.core.signals import post_database_setup
        from openslides.projector.api import register_slide_model
        from openslides.utils.rest_api import router
        from .signals import create_builtin_groups_and_admin, setup_users_config, user_post_save
        from .views import UserViewSet

        # Load User model.
        User = self.get_model('User')

        # Connect signals.
        config_signal.connect(setup_users_config, dispatch_uid='setup_users_config')
        post_database_setup.connect(create_builtin_groups_and_admin, dispatch_uid='users_create_builtin_groups_and_admin')
        post_save.connect(user_post_save, sender=User, dispatch_uid='users_user_post_save')

        # Register slides.
        register_slide_model(User, 'participant/user_slide.html')

        # Register viewsets.
        router.register('users/user', UserViewSet)
