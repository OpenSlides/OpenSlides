from django.apps import AppConfig
from django.db.models.signals import post_migrate


class MotionAppConfig(AppConfig):
    name = 'openslides.motions'
    verbose_name = 'OpenSlides Motion'

    def ready(self):
        # Import all required stuff.
        from openslides.config.signals import config_signal
        from openslides.utils.rest_api import router
        from .signals import create_builtin_workflows, setup_motion_config
        from .views import CategoryViewSet, MotionViewSet, WorkflowViewSet

        # Connect signals.
        config_signal.connect(setup_motion_config, dispatch_uid='setup_motion_config')
        post_migrate.connect(create_builtin_workflows, dispatch_uid='motion_create_builtin_workflows')

        # Register viewsets.
        router.register('motions/category', CategoryViewSet)
        router.register('motions/motion', MotionViewSet)
        router.register('motions/workflow', WorkflowViewSet)
