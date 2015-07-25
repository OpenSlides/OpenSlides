from django.apps import AppConfig


class AssignmentsAppConfig(AppConfig):
    name = 'openslides.assignments'
    verbose_name = 'OpenSlides Assignments'
    angular_site_module = True
    angular_projector_module = True
    js_files = ['js/assignments/assignments.js']

    def ready(self):
        # Load projector elements.
        # Do this by just importing all from these files.
        from . import projector, rest_api  # noqa

        # Import all required stuff.
        from openslides.core.signals import config_signal
        from .signals import setup_assignment_config

        # Connect signals.
        config_signal.connect(setup_assignment_config, dispatch_uid='setup_assignment_config')
