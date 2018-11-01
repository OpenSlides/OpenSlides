from typing import Any, Dict, List, Set

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
        from ..core.signals import permission_change
        from ..utils.rest_api import router
        from .projector import get_projector_elements
        from .signals import get_permission_change_data
        from .views import AssignmentViewSet, AssignmentPollViewSet
        from ..utils.access_permissions import required_user

        # Define projector elements.
        register_projector_elements(get_projector_elements())

        # Connect signals.
        permission_change.connect(
            get_permission_change_data,
            dispatch_uid='assignments_get_permission_change_data')

        # Register viewsets.
        router.register(self.get_model('Assignment').get_collection_string(), AssignmentViewSet)
        router.register('assignments/poll', AssignmentPollViewSet)

        # Register required_users
        required_user.add_collection_string(self.get_model('Assignment').get_collection_string(), required_users)

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


def required_users(element: Dict[str, Any]) -> Set[int]:
    """
    Returns all user ids that are displayed as candidates (including poll
    options) in the assignment element.
    """
    candidates = set(related_user['user_id'] for related_user in element['assignment_related_users'])
    for poll in element['polls']:
        candidates.update(option['candidate_id'] for option in poll['options'])
    return candidates
