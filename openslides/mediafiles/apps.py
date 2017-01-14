from django.apps import AppConfig


class MediafilesAppConfig(AppConfig):
    name = 'openslides.mediafiles'
    verbose_name = 'OpenSlides Mediafiles'
    angular_site_module = True
    angular_projector_module = True

    def ready(self):
        # Load projector elements.
        # Do this by just importing all from these files.
        from . import projector  # noqa

        # Import all required stuff.
        from openslides.utils.rest_api import router
        from .views import MediafileViewSet

        # Register viewsets.
        router.register(self.get_model('Mediafile').get_collection_string(), MediafileViewSet)

    def get_startup_elements(self):
        from ..utils.collection import Collection
        return [Collection(self.get_model('Mediafile').get_collection_string())]
