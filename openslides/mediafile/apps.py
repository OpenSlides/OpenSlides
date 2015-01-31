from django.apps import AppConfig


class MediafileAppConfig(AppConfig):
    name = 'openslides.mediafile'
    verbose_name = 'OpenSlides Mediafile'

    def ready(self):
        # Load main menu entry and widgets.
        # Do this by just importing all from these files.
        from . import main_menu, widgets  # noqa

        # Import all required stuff.
        from openslides.projector.api import register_slide
        from openslides.utils.rest_api import router
        from openslides.utils.signals import template_manipulation
        from .slides import mediafile_presentation_as_slide
        from .template import add_mediafile_stylesheets
        from .views import MediafileViewSet

        # Connect template signal.
        template_manipulation.connect(add_mediafile_stylesheets, dispatch_uid='add_mediafile_stylesheets')

        # Register slides.
        Mediafile = self.get_model('Mediafile')
        register_slide('mediafile', mediafile_presentation_as_slide, Mediafile)

        # Register viewsets.
        router.register('mediafile/mediafile', MediafileViewSet)
