from django.apps import AppConfig


class CoreAppConfig(AppConfig):
    name = 'openslides.core'
    verbose_name = 'OpenSlides Core'

    def ready(self):
        # Load projector elements.
        # Do this by just importing all from these files.
        from . import projector  # noqa

        # Import all required stuff.
        from django.db.models import signals
        from openslides.config.signals import config_signal
        from openslides.utils.autoupdate import inform_changed_data_receiver
        from openslides.utils.rest_api import router
        from .signals import setup_general_config
        from .views import CustomSlideViewSet, ProjectorViewSet, TagViewSet

        # Connect signals.
        config_signal.connect(setup_general_config, dispatch_uid='setup_general_config')

        # Register viewsets.
        router.register('core/projector', ProjectorViewSet)
        router.register('core/customslide', CustomSlideViewSet)
        router.register('core/tag', TagViewSet)

        # Update data when any model of any installed app is saved or deleted.
        # TODO: Test if the m2m_changed signal is also needed.
        signals.post_save.connect(
            inform_changed_data_receiver,
            dispatch_uid='inform_changed_data_receiver')
        signals.post_delete.connect(
            inform_changed_data_receiver,
            dispatch_uid='inform_changed_data_receiver')
