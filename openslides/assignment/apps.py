from django.apps import AppConfig


class AssignmentAppConfig(AppConfig):
    name = 'openslides.assignment'
    verbose_name = 'OpenSlides Assignment'

    def ready(self):
        # Load main menu entry, personal info and widgets.
        # Do this by just importing all from these files.
        from . import main_menu, personal_info, widgets  # noqa

        # Import all required stuff.
        from openslides.config.signals import config_signal
        from openslides.projector.api import register_slide_model
        from openslides.utils.signals import template_manipulation
        from .signals import setup_assignment_config
        from .template import add_assignment_stylesheets

        # Connect signals.
        config_signal.connect(setup_assignment_config, dispatch_uid='setup_assignment_config')

        # Connect template signal.
        template_manipulation.connect(add_assignment_stylesheets, dispatch_uid='add_assignment_stylesheets')

        # Register slides.
        Assignment = self.get_model('Assignment')
        AssignmentPoll = self.get_model('AssignmentPoll')
        register_slide_model(Assignment, 'assignment/slide.html')
        register_slide_model(AssignmentPoll, 'assignment/assignmentpoll_slide.html')
