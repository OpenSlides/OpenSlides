from openslides.core.exceptions import ProjectorException
from openslides.core.views import TagViewSet
from openslides.utils.projector import ProjectorElement, ProjectorRequirement

from .models import Motion
from .views import CategoryViewSet, MotionViewSet, WorkflowViewSet


class MotionSlide(ProjectorElement):
    """
    Slide definitions for Motion model.

    Set 'id' to get a detail slide. Omit it to get a list slide.
    """
    name = 'motions/motion'

    def check_data(self):
        pk = self.config_entry.get('id')
        if pk is not None:
            # Detail slide.
            if not Motion.objects.filter(pk=pk).exists():
                raise ProjectorException('Motion does not exist.')

    def get_requirements(self, config_entry):
        pk = config_entry.get('id')
        if pk is None:
            # List slide. Related objects like users and tags are not unlocked.
            yield ProjectorRequirement(
                view_class=MotionViewSet,
                view_action='list')
        else:
            # Detail slide.
            try:
                motion = Motion.objects.get(pk=pk)
            except Motion.DoesNotExist:
                # Motion does not exist. Just do nothing.
                pass
            else:
                yield ProjectorRequirement(
                    view_class=MotionViewSet,
                    view_action='retrieve',
                    pk=str(motion.pk))
                if motion.category:
                    yield ProjectorRequirement(
                        view_class=CategoryViewSet,
                        view_action='retrieve',
                        pk=str(motion.category.pk))
                yield ProjectorRequirement(
                    view_class=WorkflowViewSet,
                    view_action='retrieve',
                    pk=str(motion.workflow))
                for submitter in motion.submitters.all():
                    yield ProjectorRequirement(
                        view_class=submitter.get_view_class(),
                        view_action='retrieve',
                        pk=str(submitter.pk))
                for supporter in motion.supporters.all():
                    yield ProjectorRequirement(
                        view_class=supporter.get_view_class(),
                        view_action='retrieve',
                        pk=str(supporter.pk))
                for tag in motion.tags.all():
                    yield ProjectorRequirement(
                        view_class=TagViewSet,
                        view_action='retrieve',
                        pk=str(tag.pk))
