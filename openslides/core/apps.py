from django.apps import AppConfig
from ..utils.permissions import Permission


class CoreAppConfig(AppConfig):
    name = 'openslides.core'
    verbose_name = 'OpenSlides Core'
    angular_site_module = True
    angular_projector_module = True

    def get_permissions(self):
        return (
            Permission(self, 'can_see_projector', 'Can see the projector', (1, 2, 3, 4)),
            Permission(self, 'can_manage_projector', 'Can manage the projector', (3, )),
            Permission(self, 'can_see_frontpage', 'Can see the front page', (1, 2, 3, 4)),
            Permission(self, 'can_manage_tags', 'Can manage tags', (3, )),
            Permission(self, 'can_manage_config', 'Can manage configuration', (3, )),
            Permission(self, 'can_use_chat', 'Can use the chat', (3, )),
        )

    def ready(self):
        # Load projector elements.
        # Do this by just importing all from these files.
        from . import projector  # noqa

        # Import all required stuff.
        from django.db.models import signals
        from openslides.core.config import config
        from openslides.utils.rest_api import router
        from openslides.utils.search import index_add_instance, index_del_instance
        from .config_variables import get_config_variables
        from .signals import create_builtin_projection_defaults
        from .views import (
            ChatMessageViewSet,
            ConfigViewSet,
            ProjectorViewSet,
            TagViewSet,
        )

        # Define config variables
        config.update_config_variables(get_config_variables())

        # Connect signals.
        #TODO
        # post_permission_creation.connect(
        #     create_builtin_projection_defaults,
        #     dispatch_uid='create_builtin_projection_defaults')

        # Register viewsets.
        router.register(self.get_model('Projector').get_collection_string(), ProjectorViewSet)
        router.register(self.get_model('ChatMessage').get_collection_string(), ChatMessageViewSet)
        router.register(self.get_model('Tag').get_collection_string(), TagViewSet)
        router.register(self.get_model('ConfigStore').get_collection_string(), ConfigViewSet, 'config')

        # Update the search when a model is saved or deleted
        signals.post_save.connect(
            index_add_instance,
            dispatch_uid='index_add_instance')
        signals.post_delete.connect(
            index_del_instance,
            dispatch_uid='index_del_instance')
        signals.m2m_changed.connect(
            index_add_instance,
            dispatch_uid='m2m_index_add_instance')
