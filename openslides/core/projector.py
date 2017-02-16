from ..utils.projector import ProjectorElement
from .exceptions import ProjectorException
from .models import Countdown, ProjectorMessage


class Clock(ProjectorElement):
    """
    Clock on the projector.
    """
    name = 'core/clock'


class CountdownElement(ProjectorElement):
    """
    Countdown slide for the projector.
    """
    name = 'core/countdown'

    def check_data(self):
        if not Countdown.objects.filter(pk=self.config_entry.get('id')).exists():
            raise ProjectorException('Countdown does not exists.')

    def get_requirements(self, config_entry):
        try:
            countdown = Countdown.objects.get(pk=config_entry.get('id'))
        except Countdown.DoesNotExist:
            # Just do nothing if message does not exist
            pass
        else:
            yield countdown


class ProjectorMessageElement(ProjectorElement):
    """
    Short message on the projector. Rendered as overlay.
    """
    name = 'core/projector-message'

    def check_data(self):
        if not ProjectorMessage.objects.filter(pk=self.config_entry.get('id')).exists():
            raise ProjectorException('Message does not exists.')

    def get_requirements(self, config_entry):
        try:
            message = ProjectorMessage.objects.get(pk=config_entry.get('id'))
        except ProjectorMessage.DoesNotExist:
            # Just do nothing if message does not exist
            pass
        else:
            yield message
