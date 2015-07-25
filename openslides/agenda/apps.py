from django.apps import AppConfig


class AgendaAppConfig(AppConfig):
    name = 'openslides.agenda'
    verbose_name = 'OpenSlides Agenda'
    angular_site_module = True
    angular_projector_module = True
    js_files = ['js/agenda/agenda.js']

    def ready(self):
        # Load projector elements.
        # Do this by just importing all from these files.
        from . import projector, rest_api  # noqa

        # Import all required stuff.
        from django.db.models.signals import pre_delete
        from openslides.core.signals import config_signal
        from .signals import setup_agenda_config, listen_to_related_object_delete_signal

        # Connect signals.
        config_signal.connect(setup_agenda_config, dispatch_uid='setup_agenda_config')
        pre_delete.connect(
            listen_to_related_object_delete_signal,
            dispatch_uid='agenda_listen_to_related_object_delete_signal')
