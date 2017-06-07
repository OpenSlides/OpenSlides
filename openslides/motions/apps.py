from django.apps import AppConfig
from django.db.models.signals import post_migrate


class MotionsAppConfig(AppConfig):
    name = 'openslides.motions'
    verbose_name = 'OpenSlides Motion'
    angular_site_module = True
    angular_projector_module = True

    def ready(self):
        # Load projector elements.
        # Do this by just importing all from these files.
        from . import projector  # noqa

        # Import all required stuff.
        from openslides.core.config import config
        from openslides.core.signals import permission_change, user_data_required
        from openslides.utils.rest_api import router
        from .config_variables import get_config_variables
        from .signals import create_builtin_workflows, get_permission_change_data, required_users
        from .views import CategoryViewSet, MotionViewSet, MotionBlockViewSet, MotionPollViewSet, MotionChangeRecommendationViewSet, WorkflowViewSet

        # Define config variables
        config.update_config_variables(get_config_variables())

        # Connect signals.
        post_migrate.connect(create_builtin_workflows, dispatch_uid='motion_create_builtin_workflows')
        permission_change.connect(
            get_permission_change_data,
            dispatch_uid='motions_get_permission_change_data')
        user_data_required.connect(
            required_users,
            dispatch_uid='motions_required_users')

        # Register viewsets.
        router.register(self.get_model('Category').get_collection_string(), CategoryViewSet)
        router.register(self.get_model('Motion').get_collection_string(), MotionViewSet)
        router.register(self.get_model('MotionBlock').get_collection_string(), MotionBlockViewSet)
        router.register(self.get_model('Workflow').get_collection_string(), WorkflowViewSet)
        router.register(self.get_model('MotionChangeRecommendation').get_collection_string(),
                        MotionChangeRecommendationViewSet)
        router.register(self.get_model('MotionPoll').get_collection_string(), MotionPollViewSet)

    def get_collection_sources(self):
        from .models import Category, Motion, MotionBlock, Workflow, MotionChangeRecommendation
        yield from (Category, Motion, MotionBlock, Workflow, MotionChangeRecommendation)
