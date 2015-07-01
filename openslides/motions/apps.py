from django.apps import AppConfig
from django.db.models.signals import post_migrate


class MotionsAppConfig(AppConfig):
    name = 'openslides.motions'
    verbose_name = 'OpenSlides Motion'
    angular_site_module = True
    angular_projector_module = True
    js_files = ['js/motions/motions.js']

    def ready(self):
        # Load projector elements.
        # Do this by just importing all from these files.
        from . import projector  # noqa

        # Import all required stuff.
        from openslides.core.signals import config_signal
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
