from django.apps import AppConfig


class ConfigAppConfig(AppConfig):
    name = 'openslides.config'
    verbose_name = 'OpenSlides Config'

    def ready(self):
        # Load main menu entry.
        # Do this by just importing all from this file.
        from . import main_menu  # noqa
