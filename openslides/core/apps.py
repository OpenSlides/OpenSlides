from django.apps import AppConfig
from django.conf import settings


class CoreAppConfig(AppConfig):
    name = 'openslides.core'
    verbose_name = 'OpenSlides Core'
    angular_site_module = True
    angular_projector_module = True

    def ready(self):
        # Load projector elements.
        # Do this by just importing all from these files.
        from . import projector  # noqa

        # Import all required stuff.
        from .config import config
        from .signals import post_permission_creation
        from ..utils.rest_api import router
        from .config_variables import get_config_variables
        from .signals import (
            delete_django_app_permissions,
            get_permission_change_data,
            permission_change,
            required_users,
            user_data_required)
        from .views import (
            ChatMessageViewSet,
            ConfigViewSet,
            CountdownViewSet,
            ProjectorMessageViewSet,
            ProjectorViewSet,
            TagViewSet,
        )

        # Define config variables
        config.update_config_variables(get_config_variables())

        # Connect signals.
        post_permission_creation.connect(
            delete_django_app_permissions,
            dispatch_uid='delete_django_app_permissions')
        permission_change.connect(
            get_permission_change_data,
            dispatch_uid='core_get_permission_change_data')
        user_data_required.connect(
            required_users,
            dispatch_uid='core_required_users')

        # Register viewsets.
        router.register(self.get_model('Projector').get_collection_string(), ProjectorViewSet)
        router.register(self.get_model('ChatMessage').get_collection_string(), ChatMessageViewSet)
        router.register(self.get_model('Tag').get_collection_string(), TagViewSet)
        router.register(self.get_model('ConfigStore').get_collection_string(), ConfigViewSet, 'config')
        router.register(self.get_model('ProjectorMessage').get_collection_string(), ProjectorMessageViewSet)
        router.register(self.get_model('Countdown').get_collection_string(), CountdownViewSet)

    def get_collection_sources(self):
        from .models import Projector, ChatMessage, Tag, ProjectorMessage, Countdown
        from .config import config
        yield from (Projector, ChatMessage, Tag, ProjectorMessage, Countdown, config)

    def get_angular_constants(self):
        # Client settings
        client_settings_keys = [
            'MOTIONS_ALLOW_AMENDMENTS_OF_AMENDMENTS'
        ]
        client_settings_dict = {}
        for key in client_settings_keys:
            try:
                client_settings_dict[key] = getattr(settings, key)
            except AttributeError:
                # Settings key does not exist. Do nothing. The client will
                # treat this as undefined.
                pass
        client_settings = {
            'name': 'OpenSlidesSettings',
            'value': client_settings_dict}
        return [client_settings]
