from django.apps import AppConfig


class CoreAppConfig(AppConfig):
    name = 'openslides.core'
    verbose_name = 'OpenSlides Core'

    def ready(self):
        # Load main menu entry and widgets.
        # Do this by just importing all from these files.
        from . import main_menu, widgets  # noqa

        # Import all required stuff.
        from openslides.config.signals import config_signal
        from openslides.projector.api import register_slide_model
        from openslides.utils.rest_api import router
        from .signals import setup_general_config
        from .views import CustomSlideViewSet

        # Connect signals.
        config_signal.connect(setup_general_config, dispatch_uid='setup_general_config')

        # Register slides.
        CustomSlide = self.get_model('CustomSlide')
        register_slide_model(CustomSlide, 'core/customslide_slide.html')

        # Register viewset.
        router.register('core/customslide', CustomSlideViewSet)
