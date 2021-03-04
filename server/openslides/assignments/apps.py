from django.apps import AppConfig


class AssignmentsAppConfig(AppConfig):
    name = "openslides.assignments"
    verbose_name = "OpenSlides Assignments"

    def ready(self):
        # Import all required stuff.
        from ..core.signals import permission_change
        from ..utils.rest_api import router
        from . import serializers  # noqa
        from .signals import get_permission_change_data
        from .views import (
            AssignmentOptionViewSet,
            AssignmentPollViewSet,
            AssignmentViewSet,
            AssignmentVoteViewSet,
        )

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
