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
        from openslides.projector.api import register_slide_model
        from openslides.utils.rest_api import router
        from .signals import setup_users_config, user_post_save
        from .views import GroupViewSet, UserViewSet

        # Load User model.
        User = self.get_model('User')

        # Connect signals.
        config_signal.connect(setup_users_config, dispatch_uid='setup_users_config')
        post_save.connect(user_post_save, sender=User, dispatch_uid='users_user_post_save')

        # Register slides.
        register_slide_model(User, 'participant/user_slide.html')

        # Register viewsets.
        router.register('users/user', UserViewSet)
        router.register('users/group', GroupViewSet)
