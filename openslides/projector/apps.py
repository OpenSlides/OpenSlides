from django.apps import AppConfig


class ProjectorAppConfig(AppConfig):
    name = 'openslides.projector'
    verbose_name = 'OpenSlides Projector'

    def ready(self):
        # Load widgets.
        # Do this by just importing all from this file.
        from . import widgets  # noqa

        # Import all required stuff.
        from openslides.config.signals import config_signal
        from .signals import (
            countdown, projector_clock, projector_overlays,
            projector_overlay_message, setup_projector_config)

        # Connect signals.
        config_signal.connect(setup_projector_config, dispatch_uid='setup_projector_config')
        projector_overlays.connect(countdown, dispatch_uid="projector_countdown")
        projector_overlays.connect(projector_overlay_message, dispatch_uid="projector_overlay_message")
        projector_overlays.connect(projector_clock, dispatch_uid="projector_clock")
