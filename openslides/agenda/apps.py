from django.apps import AppConfig


class AgendaAppConfig(AppConfig):
    name = 'openslides.agenda'
    verbose_name = 'OpenSlides Agenda'

    def ready(self):
        # Load main menu entry, personal info and widgets.
        # Do this by just importing all from these files.
        from . import main_menu, personal_info, widgets  # noqa

        # Import all required stuff.
        from django.db.models.signals import pre_delete
        from openslides.config.signals import config_signal
        from openslides.projector.api import register_slide
        from openslides.projector.signals import projector_overlays
        from openslides.utils.rest_api import router
        from .signals import agenda_list_of_speakers, setup_agenda_config, listen_to_related_object_delete_signal
        from .slides import agenda_slide
        from .views import ItemViewSet

        # Connect signals.
        config_signal.connect(setup_agenda_config, dispatch_uid='setup_agenda_config')
        projector_overlays.connect(agenda_list_of_speakers, dispatch_uid='agenda_list_of_speakers')
        pre_delete.connect(listen_to_related_object_delete_signal, dispatch_uid='agenda_listen_to_related_object_delete_signal')

        # Register slides.
        Item = self.get_model('Item')
        register_slide('agenda', agenda_slide, Item)

        # Register viewset.
        router.register('agenda/item', ItemViewSet)
