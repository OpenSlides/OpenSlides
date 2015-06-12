from django.utils.timezone import now
from django.utils.translation import ugettext as _

from openslides.utils.projector import ProjectorElement, ProjectorRequirement

from .exceptions import ProjectorException
from .models import CustomSlide
from .views import CustomSlideViewSet


class CustomSlideSlide(ProjectorElement):
    """
    Slide definitions for custom slide model.
    """
    name = 'core/customslide'
    scripts = 'core/customslide_slide.js'

    def get_context(self):
        pk = self.config_entry.get('id')
        if not CustomSlide.objects.filter(pk=pk).exists():
            raise ProjectorException(_('Custom slide does not exist.'))
        return [{
            'collection': 'core/customslide',
            'id': pk}]

    def get_requirements(self, config_entry):
        self.config_entry = config_entry
        try:
            pk = self.get_context()[0]['id']
        except ProjectorException:
            # Custom slide does not exist so just do nothing.
            pass
        else:
            yield ProjectorRequirement(
                view_class=CustomSlideViewSet,
                view_action='retrieve',
                pk=str(pk))


class Clock(ProjectorElement):
    """
    Clock on the projector.
    """
    name = 'core/clock'
    scripts = 'core/clock.js'

    def get_context(self):
        return {'server_time': now().timestamp()}


class Countdown(ProjectorElement):
    """
    Countdown on the projector.

    To start the countdown write into the config field:

        {
            "countdown_time": <timestamp>,
            "status": "go"
        }

    The timestamp is a POSIX timestamp (seconds) calculated from server
    time, server time offset and countdown duration (countdown_time = now -
    serverTimeOffset + duration).

    To stop the countdown set the countdown time to the actual value of the
    countdown (countdown_time = countdown_time - now + serverTimeOffset)
    and set status to "stop".

    To reset the countdown (it is not a reset in a functional way) just
    change the countdown_time. The status value remain 'stop'.

    To hide a running countdown add {"hidden": true}.
    """
    name = 'core/countdown'
    scripts = 'core/countdown.js'

    def get_context(self):
        if self.config_entry.get('countdown_time') is None:
            raise ProjectorException(_('No countdown time given.'))
        if self.config_entry.get('status') is None:
            raise ProjectorException(_('No status given.'))
        return {'server_time': now().timestamp()}


class Message(ProjectorElement):
    """
    Short message on the projector. Rendered as overlay.
    """
    name = 'core/message'
    scripts = 'core/message.js'

    def get_context(self):
        if self.config_entry.get('message') is None:
            raise ProjectorException(_('No message given.'))
