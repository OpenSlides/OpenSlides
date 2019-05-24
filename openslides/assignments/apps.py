from typing import Any, Dict, Set

from django.apps import AppConfig


class AssignmentsAppConfig(AppConfig):
    name = "openslides.assignments"
    verbose_name = "OpenSlides Assignments"

    def ready(self):
        # Import all required stuff.
        from ..core.signals import permission_change
        from ..utils.access_permissions import required_user
        from ..utils.rest_api import router
        from . import serializers  # noqa
        from .projector import register_projector_slides
        from .signals import get_permission_change_data
        from .views import AssignmentViewSet, AssignmentPollViewSet

        # Define projector elements.
        register_projector_slides()

        # Connect signals.
        permission_change.connect(
            get_permission_change_data,
            dispatch_uid="assignments_get_permission_change_data",
        )

        # Register viewsets.
        router.register(
            self.get_model("Assignment").get_collection_string(), AssignmentViewSet
        )
        router.register("assignments/poll", AssignmentPollViewSet)

        # Register required_users
        required_user.add_collection_string(
            self.get_model("Assignment").get_collection_string(), required_users
        )

    def get_config_variables(self):
        from .config_variables import get_config_variables

        return get_config_variables()

    def get_startup_elements(self):
        """
        Yields all Cachables required on startup i. e. opening the websocket
        connection.
        """
        yield self.get_model("Assignment")


def required_users(element: Dict[str, Any]) -> Set[int]:
    """
    Returns all user ids that are displayed as candidates (including poll
    options) in the assignment element.
    """
    candidates = set(
        related_user["user_id"] for related_user in element["assignment_related_users"]
    )
    for poll in element["polls"]:
        candidates.update(option["candidate_id"] for option in poll["options"])
    return candidates
