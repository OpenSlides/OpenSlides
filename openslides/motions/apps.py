from typing import Any, Dict, Set

from django.apps import AppConfig
from django.db.models.signals import post_migrate


class MotionsAppConfig(AppConfig):
    name = "openslides.motions"
    verbose_name = "OpenSlides Motion"

    def ready(self):
        # Import all required stuff.
        from openslides.core.signals import permission_change
        from openslides.utils.rest_api import router

        from ..utils.access_permissions import required_user
        from . import serializers  # noqa
        from .projector import register_projector_slides
        from .signals import create_builtin_workflows, get_permission_change_data
        from .views import (
            CategoryViewSet,
            MotionBlockViewSet,
            MotionChangeRecommendationViewSet,
            MotionCommentSectionViewSet,
            MotionOptionViewSet,
            MotionPollViewSet,
            MotionViewSet,
            MotionVoteViewSet,
            StateViewSet,
            StatuteParagraphViewSet,
            WorkflowViewSet,
        )

        # Define projector elements.
        register_projector_slides()

        # Connect signals.
        post_migrate.connect(
            create_builtin_workflows, dispatch_uid="motion_create_builtin_workflows"
        )
        permission_change.connect(
            get_permission_change_data,
            dispatch_uid="motions_get_permission_change_data",
        )

        # Register viewsets.
        router.register(
            self.get_model("Category").get_collection_string(), CategoryViewSet
        )
        router.register(
            self.get_model("StatuteParagraph").get_collection_string(),
            StatuteParagraphViewSet,
        )
        router.register(self.get_model("Motion").get_collection_string(), MotionViewSet)
        router.register(
            self.get_model("MotionBlock").get_collection_string(), MotionBlockViewSet
        )
        router.register(
            self.get_model("MotionCommentSection").get_collection_string(),
            MotionCommentSectionViewSet,
        )
        router.register(
            self.get_model("Workflow").get_collection_string(), WorkflowViewSet
        )
        router.register(
            self.get_model("MotionChangeRecommendation").get_collection_string(),
            MotionChangeRecommendationViewSet,
        )
        router.register(
            self.get_model("MotionPoll").get_collection_string(), MotionPollViewSet
        )
        router.register(
            self.get_model("MotionOption").get_collection_string(), MotionOptionViewSet
        )
        router.register(
            self.get_model("MotionVote").get_collection_string(), MotionVoteViewSet
        )
        router.register(self.get_model("State").get_collection_string(), StateViewSet)

        # Register required_users
        required_user.add_collection_string(
            self.get_model("Motion").get_collection_string(), required_users_motions
        )

        required_user.add_collection_string(
            self.get_model("MotionPoll").get_collection_string(),
            required_users_motion_polls,
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
            "Category",
            "StatuteParagraph",
            "Motion",
            "MotionBlock",
            "Workflow",
            "State",
            "MotionChangeRecommendation",
            "MotionCommentSection",
            "MotionPoll",
            "MotionOption",
            "MotionVote",
        ):
            yield self.get_model(model_name)


async def required_users_motions(element: Dict[str, Any]) -> Set[int]:
    """
    Returns all user ids that are displayed as as submitter or supporter in
    any motion if request_user can see motions. This function may return an
    empty set.
    """
    submitters_supporters = set(
        [submitter["user_id"] for submitter in element["submitters"]]
    )
    submitters_supporters.update(element["supporters_id"])
    return submitters_supporters


async def required_users_motion_polls(element: Dict[str, Any]) -> Set[int]:
    """
    Returns all user ids that have voted on an option and are therefore required for the single votes table.
    """
    from openslides.poll.models import BasePoll

    if element["state"] == BasePoll.STATE_PUBLISHED:
        return element["voted_id"]
    else:
        return set()
