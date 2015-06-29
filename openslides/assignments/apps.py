from django.apps import AppConfig


class AssignmentAppConfig(AppConfig):
    name = 'openslides.assignments'
    verbose_name = 'OpenSlides Assignments'

    def ready(self):
        # Load projector elements.
        # Do this by just importing all from these files.
        from . import projector  # noqa

        # Import all required stuff.
        from openslides.core.signals import config_signal
        from openslides.utils.rest_api import router
        from .signals import setup_assignment_config
        from .views import AssignmentViewSet, AssignmentPollViewSet

        # Connect signals.
        config_signal.connect(setup_assignment_config, dispatch_uid='setup_assignment_config')

        # Register viewsets.
        router.register('assignments/assignment', AssignmentViewSet)
        router.register('assignments/assignmentpoll', AssignmentPollViewSet)
