from django.utils.timezone import now
from django.utils.translation import ugettext as _

from openslides.utils.projector import ProjectorElement, ProjectorRequirement

from .config import config
from .exceptions import ProjectorException
from .models import CustomSlide, Projector
from .views import CustomSlideViewSet


class CustomSlideSlide(ProjectorElement):
    """
    Slide definitions for custom slide model.
    """
    name = 'core/customslide'

    def get_context(self):
        if not CustomSlide.objects.filter(pk=self.config_entry.get('id')).exists():
            raise ProjectorException(_('Custom slide does not exist.'))

    def get_requirements(self, config_entry):
        pk = config_entry.get('id')
        if pk is not None:
            yield ProjectorRequirement(
                view_class=CustomSlideViewSet,
                view_action='retrieve',
                pk=str(pk))


class Clock(ProjectorElement):
    """
    Clock on the projector.
    """
    name = 'core/clock'

    def get_context(self):
        return {'server_time': now().timestamp()}


class Countdown(ProjectorElement):
    """
    Countdown on the projector.

    To start the countdown write into the config field:

        {
            "countdown_time": <timestamp>,
            "status": "running"
        }

    The timestamp is a POSIX timestamp (seconds) calculated from server
    time, server time offset and countdown duration (countdown_time = now -
    serverTimeOffset + duration).

    To stop the countdown set the countdown time to the current value of the
    countdown (countdown_time = countdown_time - now + serverTimeOffset)
    and set status to "stop".

    To reset the countdown (it is not a reset in a functional way) just
    change the countdown_time. The status value remains "stop".

    There might be an additional value for the "default" countdown time
    which is used for the internal reset method if the countdown is coupled
    with the list of speakers.

    To hide a countdown add {"hidden": true}.
    """
    name = 'core/countdown'

    def get_context(self):
        self.validate_config(self.config_entry)
        return {'server_time': now().timestamp()}

    @classmethod
    def validate_config(cls, config_data):
        """
        Raises ProjectorException if the given data are invalid.
        """
        if not isinstance(config_data.get('countdown_time'), (int, float)):
            raise ProjectorException(_('Invalid countdown time. Use integer or float.'))
        if config_data.get('status') not in ('running', 'stop'):
            raise ProjectorException(_("Invalid status. Use 'running' or 'stop'."))
        if config_data.get('default') is not None and not isinstance(config_data.get('default'), int):
            raise ProjectorException(_('Invalid default value. Use integer.'))

    @classmethod
    def control(cls, action, projector_id=1, index=0):
        """
        Starts, stops or resets the countdown with the given index on the
        given projector.

        Action must be 'start', 'stop' or 'reset'.
        """
        if action not in ('start', 'stop', 'reset'):
            raise ValueError("Action must be 'start', 'stop' or 'reset', not {}.".format(action))

        projector_instance = Projector.objects.get(pk=projector_id)
        projector_config = {}
        found = False
        for key, value in projector_instance.config.items():
            if value['name'] == cls.name:
                if index == 0:
                    try:
                        cls.validate_config(value)
                    except ProjectorException:
                        # Do not proceed if the specific procjector config data is invalid.
                        # The variable found remains False.
                        break
                    found = True
                    if action == 'start' and value['status'] == 'stop':
                        value['status'] = 'running'
                        value['countdown_time'] = now().timestamp() + value['countdown_time']
                    elif action == 'stop' and value['status'] == 'running':
                        value['status'] = 'stop'
                        value['countdown_time'] = value['countdown_time'] - now().timestamp()
                    elif action == 'reset':
                        value['status'] = 'stop'
                        value['countdown_time'] = value.get('default', config['projector_default_countdown'])
                else:
                    index += -1
            projector_config[key] = value
        if found:
            projector_instance.config = projector_config
            projector_instance.save()


class Message(ProjectorElement):
    """
    Short message on the projector. Rendered as overlay.
    """
    name = 'core/message'

    def get_context(self):
        if self.config_entry.get('message') is None:
            raise ProjectorException(_('No message given.'))
