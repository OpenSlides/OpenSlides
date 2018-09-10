from typing import List

from django.apps import AppConfig
from mypy_extensions import TypedDict

from ..utils.projector import register_projector_elements


class AssignmentsAppConfig(AppConfig):
    name = 'openslides.assignments'
    verbose_name = 'OpenSlides Assignments'
    angular_site_module = True
    angular_projector_module = True

    def ready(self):
        # Import all required stuff.
        from ..core.signals import permission_change, user_data_required
        from ..utils.rest_api import router
        from .projector import get_projector_elements
        from .signals import get_permission_change_data, required_users
        from .views import AssignmentViewSet, AssignmentPollViewSet

        # Define projector elements.
        register_projector_elements(get_projector_elements())

        # Connect signals.
        permission_change.connect(
            get_permission_change_data,
            dispatch_uid='assignments_get_permission_change_data')
        user_data_required.connect(
            required_users,
            dispatch_uid='assignments_required_users')

        # Register viewsets.
        router.register(self.get_model('Assignment').get_collection_string(), AssignmentViewSet)
        router.register('assignments/poll', AssignmentPollViewSet)

    def get_config_variables(self):
        from .config_variables import get_config_variables
        return get_config_variables()

    def get_startup_elements(self):
        """
        Yields all Cachables required on startup i. e. opening the websocket
        connection.
        """
        yield self.get_model('Assignment')

    def get_angular_constants(self):
        assignment = self.get_model('Assignment')
        Item = TypedDict('Item', {'value': int, 'display_name': str})
        phases: List[Item] = []
        for phase in assignment.PHASES:
            phases.append({
                'value': phase[0],
                'display_name': phase[1],
            })
        return {'AssignmentPhases': phases}
