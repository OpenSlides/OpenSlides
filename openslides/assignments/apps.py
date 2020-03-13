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
        from .views import (
            AssignmentViewSet,
            AssignmentPollViewSet,
            AssignmentOptionViewSet,
            AssignmentVoteViewSet,
        )

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
        router.register(
            self.get_model("AssignmentPoll").get_collection_string(),
            AssignmentPollViewSet,
        )
        router.register(
            self.get_model("AssignmentOption").get_collection_string(),
            AssignmentOptionViewSet,
        )
        router.register(
            self.get_model("AssignmentVote").get_collection_string(),
            AssignmentVoteViewSet,
        )

        # Register required_users
        required_user.add_collection_string(
            self.get_model("Assignment").get_collection_string(),
            required_users_assignments,
        )
        required_user.add_collection_string(
            self.get_model("AssignmentPoll").get_collection_string(),
            required_users_options,
        )

    def get_config_variables(self):
        from .config_variables import get_config_variables

        return get_config_variables()

    def get_startup_elements(self):
        """
        Yields all Cachables required on startup i. e. opening the websocket
        connection.
        """
        for model_name in (
            "Assignment",
            "AssignmentPoll",
            "AssignmentVote",
            "AssignmentOption",
        ):
            yield self.get_model(model_name)


async def required_users_assignments(element: Dict[str, Any]) -> Set[int]:
    """
    Returns all user ids that are displayed as candidates (including poll
    options) in the assignment element.
    """
    from openslides.assignments.models import AssignmentPoll, AssignmentOption
    from openslides.utils.cache import element_cache

    candidates = set(
        related_user["user_id"] for related_user in element["assignment_related_users"]
    )
    for poll_id in element["polls_id"]:
        poll = await element_cache.get_element_data(
            AssignmentPoll.get_collection_string(), poll_id
        )
        if poll:
            for option_id in poll["options_id"]:
                option = await element_cache.get_element_data(
                    AssignmentOption.get_collection_string(), option_id
                )
                if option:
                    candidates.add(option["user_id"])
    return candidates


async def required_users_options(element: Dict[str, Any]) -> Set[int]:
    """
    Returns all user ids that have voted on an option and are therefore required for the single votes table.
    """
    return element["voted_id"]
