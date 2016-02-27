from django.utils.timezone import now

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

    def check_data(self):
        if not CustomSlide.objects.filter(pk=self.config_entry.get('id')).exists():
            raise ProjectorException('Custom slide does not exist.')

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


class Countdown(ProjectorElement):
    """
    Countdown on the projector.

    To start the countdown write into the config field:

        {
            "status": "running",
            "countdown_time": <timestamp>,
        }

    The timestamp is a POSIX timestamp (seconds) calculated from client
    time, server time offset and countdown duration (countdown_time = now -
    serverTimeOffset + duration).

    To stop the countdown set the countdown time to the current value of the
    countdown (countdown_time = countdown_time - now + serverTimeOffset)
    and set status to "stop".

    To reset the countdown (it is not a reset in a functional way) just
    change the countdown time. The status value remains "stop".

    Do not forget to send values for additional keywords like "stable" if
    you do not want to use the default.

    The countdown backend supports an extra keyword "default".

        {
            "default": <seconds>
        }

    This is used for the internal reset method if the countdown is coupled
    with the list of speakers. The default of this default value can be
    customized in OpenSlides config 'projector_default_countdown'.

    Use additional keywords to control view behavior like "visable" and
    "label". These keywords are not handles by the backend.
    """
    name = 'core/countdown'

    def check_data(self):
        self.validate_config(self.config_entry)

    @classmethod
    def validate_config(cls, config_data):
        """
        Raises ProjectorException if the given data are invalid.
        """
        if not isinstance(config_data.get('countdown_time'), (int, float)):
            raise ProjectorException('Invalid countdown time. Use integer or float.')
        if config_data.get('status') not in ('running', 'stop'):
            raise ProjectorException("Invalid status. Use 'running' or 'stop'.")
        if config_data.get('default') is not None and not isinstance(config_data.get('default'), int):
            raise ProjectorException('Invalid default value. Use integer.')

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

    def check_data(self):
        if self.config_entry.get('message') is None:
            raise ProjectorException('No message given.')
