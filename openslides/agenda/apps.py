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
        from openslides.core.signals import config_signal
        from openslides.utils.rest_api import router
        from .signals import (
            setup_agenda_config,
            listen_to_related_object_post_delete,
            listen_to_related_object_post_save)
        from .views import ItemViewSet

        # Connect signals.
        config_signal.connect(setup_agenda_config, dispatch_uid='setup_agenda_config')
        post_save.connect(
            listen_to_related_object_post_save,
            dispatch_uid='listen_to_related_object_post_save')
        pre_delete.connect(
            listen_to_related_object_post_delete,
            dispatch_uid='listen_to_related_object_post_delete')

        # Register viewsets.
        router.register(self.get_model('Item').get_collection_string(), ItemViewSet)
