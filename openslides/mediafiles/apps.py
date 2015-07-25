from django.apps import AppConfig


class MediafilesAppConfig(AppConfig):
    name = 'openslides.mediafiles'
    verbose_name = 'OpenSlides Mediafiles'
    angular_site_module = True
    angular_projector_module = True
    js_files = ['js/mediafiles/mediafiles.js']

    def ready(self):
        # Load projector elements.
        # Do this by just importing all from these files.
        from . import projector, rest_api  # noqa
