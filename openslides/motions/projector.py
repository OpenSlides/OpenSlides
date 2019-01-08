from typing import Generator, Type

from ..core.exceptions import ProjectorException
from ..utils.projector import ProjectorElement
from .models import Motion, MotionBlock


class MotionSlide(ProjectorElement):
    """
    Slide definitions for Motion model.
    """

    name = "motions/motion"

    def check_data(self):
        if not Motion.objects.filter(pk=self.config_entry.get("id")).exists():
            raise ProjectorException("Motion does not exist.")

    def update_data(self):
        data = None
        try:
            motion = Motion.objects.get(pk=self.config_entry.get("id"))
        except Motion.DoesNotExist:
            # Motion does not exist, so just do nothing.
            pass
        else:
            data = {"agenda_item_id": motion.agenda_item_id}
        return data


class MotionBlockSlide(ProjectorElement):
    """
    Slide definitions for a block of motions (MotionBlock model).
    """

    name = "motions/motion-block"

    def check_data(self):
        if not MotionBlock.objects.filter(pk=self.config_entry.get("id")).exists():
            raise ProjectorException("MotionBlock does not exist.")

    def update_data(self):
        data = None
        try:
            motion_block = MotionBlock.objects.get(pk=self.config_entry.get("id"))
        except MotionBlock.DoesNotExist:
            # MotionBlock does not exist, so just do nothing.
            pass
        else:
            data = {"agenda_item_id": motion_block.agenda_item_id}
        return data


def get_projector_elements() -> Generator[Type[ProjectorElement], None, None]:
    yield MotionSlide
    yield MotionBlockSlide
