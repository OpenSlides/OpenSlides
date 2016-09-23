from ..core.exceptions import ProjectorException
from ..utils.projector import ProjectorElement
from .models import Motion


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
            motion = Motion.objects.get(pk=config_entry.get('id'))
        except Motion.DoesNotExist:
            # Motion does not exist. Just do nothing.
            pass
        else:
            yield motion
            yield motion.agenda_item
            yield motion.state.workflow
            yield from motion.submitters.all()
            yield from motion.supporters.all()

    def need_full_update_for_this(self, collection_element):
        # Full update if motion changes because then we may have new
        # submitters or supporters and therefor need new users.
        #
        # Add some logic here if we support live changing of workflows later.
        #
        return collection_element.collection_string == Motion.get_collection_string()
