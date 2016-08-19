from django.apps import AppConfig


class CoreAppConfig(AppConfig):
    name = 'openslides.core'
    verbose_name = 'OpenSlides Core'
    angular_site_module = True
    angular_projector_module = True
    js_files = ['js/core/base.js', 'js/core/site.js', 'js/core/projector.js']

    def ready(self):
        # Load projector elements.
        # Do this by just importing all from these files.
        from . import projector  # noqa

        # Import all required stuff.
        from django.db.models import signals
        from openslides.core.config import config
        from openslides.core.signals import post_permission_creation
        from openslides.utils.autoupdate import inform_changed_data_receiver, inform_deleted_data_receiver
        from openslides.utils.rest_api import router
        from openslides.utils.search import index_add_instance, index_del_instance
        from .config_variables import get_config_variables
        from .signals import delete_django_app_permissions
        from .views import (
            ChatMessageViewSet,
            ConfigViewSet,
            CustomSlideViewSet,
            ProjectorViewSet,
            TagViewSet,
        )

        # Define config variables
        config.update_config_variables(get_config_variables())

        # Connect signals.
        post_permission_creation.connect(
            delete_django_app_permissions,
            dispatch_uid='delete_django_app_permissions')

        # Register viewsets.
        router.register(self.get_model('Projector').get_collection_string(), ProjectorViewSet)
        router.register(self.get_model('ChatMessage').get_collection_string(), ChatMessageViewSet)
        router.register(self.get_model('CustomSlide').get_collection_string(), CustomSlideViewSet)
        router.register(self.get_model('Tag').get_collection_string(), TagViewSet)
        router.register(self.get_model('ConfigStore').get_collection_string(), ConfigViewSet, 'config')

        #Example code
        from .views import FakeModel, FakeModelViewSet
        from openslides.utils.autoupdate import register_extra_autoupdate_object
        register_extra_autoupdate_object(FakeModel)
        router.register('exampleapp/exampleobject', FakeModelViewSet, 'exampleobjecturl')
        #End of example code

        # Update data when any model of any installed app is saved or deleted.
        # TODO: Test if the m2m_changed signal is also needed.
        signals.post_save.connect(
            inform_changed_data_receiver,
            dispatch_uid='inform_changed_data_receiver')
        signals.post_delete.connect(
            inform_deleted_data_receiver,
            dispatch_uid='inform_deleted_data_receiver')

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
