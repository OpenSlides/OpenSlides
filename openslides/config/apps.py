from django.apps import AppConfig


class ConfigAppConfig(AppConfig):
    name = 'openslides.config'
    verbose_name = 'OpenSlides Config'

    def ready(self):
        # Load main menu entry.
        # Do this by just importing all from this file.
        from . import main_menu  # noqa

        # Import all required stuff.
        from openslides.utils.rest_api import router
        from .views import ConfigViewSet

        # Register viewsets.
        router.register('config/config', ConfigViewSet, 'config')
