from django.apps import AppConfig


class MotionAppConfig(AppConfig):
    name = 'openslides.motion'
    verbose_name = 'OpenSlides Motion'

    def ready(self):
        # Load main menu entry, personal info and widgets.
        # Do this by just importing all from these files.
        from . import main_menu, personal_info, widgets  # noqa

        # Import all required stuff.
        from openslides.config.signals import config_signal
        from openslides.core.signals import post_database_setup
        from openslides.projector.api import register_slide_model
        from .signals import create_builtin_workflows, setup_motion_config

        # Connect signals.
        config_signal.connect(setup_motion_config, dispatch_uid='setup_motion_config')
        post_database_setup.connect(create_builtin_workflows, dispatch_uid='motion_create_builtin_workflows')

        # Register slides.
        Motion = self.get_model('Motion')
        MotionPoll = self.get_model('MotionPoll')
        register_slide_model(Motion, 'motion/slide.html')
        register_slide_model(MotionPoll, 'motion/motionpoll_slide.html')
