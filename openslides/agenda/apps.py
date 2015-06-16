from django.apps import AppConfig


class AgendaAppConfig(AppConfig):
    name = 'openslides.agenda'
    verbose_name = 'OpenSlides Agenda'

    def ready(self):
        # Import all required stuff.
        from django.db.models.signals import pre_delete
        from openslides.config.signals import config_signal
        from openslides.utils.rest_api import router
        from .signals import setup_agenda_config, listen_to_related_object_delete_signal
        from .views import ItemViewSet

        # Connect signals.
        config_signal.connect(setup_agenda_config, dispatch_uid='setup_agenda_config')
        pre_delete.connect(listen_to_related_object_delete_signal, dispatch_uid='agenda_listen_to_related_object_delete_signal')

        # Register viewsets.
        router.register('agenda/item', ItemViewSet)
