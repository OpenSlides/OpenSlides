from ..core.exceptions import ProjectorException
from ..core.views import TagViewSet
from ..utils.projector import ProjectorElement, ProjectorRequirement
from .models import Motion
from .views import CategoryViewSet, MotionViewSet, WorkflowViewSet


class MotionSlide(ProjectorElement):
    """
    Slide definitions for Motion model.
    """
    name = 'motions/motion'

    def check_data(self):
        if not Motion.objects.filter(pk=self.config_entry.get('id')).exists():
            raise ProjectorException('Motion does not exist.')

    def get_requirements(self, config_entry):
        try:
            motions = Motion.objects.get(pk=config_entry.get('id'))
        except Motion.DoesNotExist:
            # Motion does not exist. Just do nothing.
            pass
        else:
            yield motions
            yield motions.agenda_item
            yield motion.workflow
            yield from motion.submitters.all()
            yield from motion.supporters.all()
