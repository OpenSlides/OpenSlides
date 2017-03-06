from django.apps import AppConfig
from django.db.models.signals import post_migrate

from ..utils.collection import Collection


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
        from openslides.core.signals import permission_change
        from openslides.utils.rest_api import router
        from .config_variables import get_config_variables
        from .signals import create_builtin_workflows, get_permission_change_data
        from .views import CategoryViewSet, MotionViewSet, MotionBlockViewSet, MotionPollViewSet, MotionChangeRecommendationViewSet, WorkflowViewSet

        # Define config variables
        config.update_config_variables(get_config_variables())

        # Connect signals.
        post_migrate.connect(create_builtin_workflows, dispatch_uid='motion_create_builtin_workflows')
        permission_change.connect(
            get_permission_change_data,
            dispatch_uid='motions_get_permission_change_data')

        # Register viewsets.
        router.register(self.get_model('Category').get_collection_string(), CategoryViewSet)
        router.register(self.get_model('Motion').get_collection_string(), MotionViewSet)
        router.register(self.get_model('MotionBlock').get_collection_string(), MotionBlockViewSet)
        router.register(self.get_model('Workflow').get_collection_string(), WorkflowViewSet)
        router.register(self.get_model('MotionChangeRecommendation').get_collection_string(),
                        MotionChangeRecommendationViewSet)
        router.register('motions/motionpoll', MotionPollViewSet)

    def get_startup_elements(self):
        """
        Yields all collections required on startup i. e. opening the websocket
        connection.
        """
        for model in ('Category', 'Motion', 'MotionBlock', 'Workflow', 'MotionChangeRecommendation'):
            yield Collection(self.get_model(model).get_collection_string())
