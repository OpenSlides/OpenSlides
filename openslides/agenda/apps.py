from django.apps import AppConfig


class AgendaAppConfig(AppConfig):
    name = 'openslides.agenda'
    verbose_name = 'OpenSlides Agenda'
    angular_site_module = True
    angular_projector_module = True
    js_files = ['js/agenda/base.js', 'js/agenda/site.js', 'js/agenda/projector.js']

    def ready(self):
        # Load projector elements.
        # Do this by just importing all from these files.
        from . import projector  # noqa

        # Import all required stuff.
        from django.db.models.signals import pre_delete, post_save
        from openslides.core.config import config
        from openslides.utils.rest_api import router
        from .config_variables import get_config_variables
        from .signals import (
            listen_to_related_object_post_delete,
            listen_to_related_object_post_save)
        from .views import ItemViewSet

        # Define config varialbes
        config.update_config_varialbes(get_config_variables())

        # Connect signals.
        post_save.connect(
            listen_to_related_object_post_save,
            dispatch_uid='listen_to_related_object_post_save')
        pre_delete.connect(
            listen_to_related_object_post_delete,
            dispatch_uid='listen_to_related_object_post_delete')

        # Register viewsets.
        router.register(self.get_model('Item').get_collection_string(), ItemViewSet)
