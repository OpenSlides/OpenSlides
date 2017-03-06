from django.apps import AppConfig

from ..utils.collection import Collection


class AssignmentsAppConfig(AppConfig):
    name = 'openslides.assignments'
    verbose_name = 'OpenSlides Assignments'
    angular_site_module = True
    angular_projector_module = True

    def ready(self):
        # Load projector elements.
        # Do this by just importing all from these files.
        from . import projector  # noqa

        # Import all required stuff.
        from openslides.core.config import config
        from openslides.core.signals import permission_change
        from openslides.utils.rest_api import router
        from .config_variables import get_config_variables
        from .signals import get_permission_change_data
        from .views import AssignmentViewSet, AssignmentPollViewSet

        # Define config variables
        config.update_config_variables(get_config_variables())

        # Connect signals.
        permission_change.connect(
            get_permission_change_data,
            dispatch_uid='assignments_get_permission_change_data')

        # Register viewsets.
        router.register(self.get_model('Assignment').get_collection_string(), AssignmentViewSet)
        router.register('assignments/poll', AssignmentPollViewSet)

    def get_startup_elements(self):
        """
        Yields all collections required on startup i. e. opening the websocket
        connection.
        """
        yield Collection(self.get_model('Assignment').get_collection_string())

    def get_angular_constants(self):
        assignment = self.get_model('Assignment')
        data = {
            'name': 'AssignmentPhases',
            'value': []}
        for phase in assignment.PHASES:
            data['value'].append({
                'value': phase[0],
                'display_name': phase[1],
            })
        return [data]
