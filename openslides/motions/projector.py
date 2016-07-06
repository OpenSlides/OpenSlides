from ..core.config import config
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
            for speaker in motion.agenda_item.speakers.filter(end_time=None):
                yield speaker.user
            query = (motion.agenda_item.speakers.exclude(end_time=None)
                     .order_by('-end_time')[:config['agenda_show_last_speakers']])
            for speaker in query:
                yield speaker.user
