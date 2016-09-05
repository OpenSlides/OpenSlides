from ..agenda.access_permissions import ItemAccessPermissions
from ..core.exceptions import ProjectorException
from ..utils.projector import ProjectorElement, ProjectorRequirement
from .access_permissions import (
    CategoryAccessPermissions,
    MotionAccessPermissions,
    WorkflowAccessPermissions,
)
from .models import Motion


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
            # List slide. Related objects like users are not unlocked.
            yield ProjectorRequirement(
                access_permissions=MotionAccessPermissions)
        else:
            # Detail slide.
            try:
                motion = Motion.objects.get(pk=pk)
            except Motion.DoesNotExist:
                # Motion does not exist. Just do nothing.
                pass
            else:
                # Motion and agenda item
                yield ProjectorRequirement(
                    access_permissions=MotionAccessPermissions,
                    id=str(pk))
                yield ProjectorRequirement(
                    access_permissions=ItemAccessPermissions,
                    id=str(motion.agenda_item_id))

                # Category
                if motion.category:
                    yield ProjectorRequirement(
                        access_permissions=CategoryAccessPermissions,
                        pk=str(motion.category_id))

                # Workflow
                yield ProjectorRequirement(
                    access_permissions=WorkflowAccessPermissions,
                    id=str(motion.workflow))

                # Submitters and suporters (users)
                for user in motion.submitters.all():
                    yield ProjectorRequirement(
                        access_permissions=user.get_access_permissions(),
                        id=str(user.pk))
                for user in motion.supporters.all():
                    yield ProjectorRequirement(
                        access_permissions=user.get_access_permissions(),
                        id=str(user.pk))

                # Hint: We do not have to yield any ProjectorRequirement
                # instances for tags because tags are always available for
                # everyone.
