import uuid

from django.utils.timezone import now

from ..utils.projector import ProjectorElement
from .config import config
from .exceptions import ProjectorException
from .models import Projector


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
            "running": True,
            "countdown_time": <timestamp>,
        }

    The timestamp is a POSIX timestamp (seconds) calculated from client
    time, server time offset and countdown duration (countdown_time = now -
    serverTimeOffset + duration).

    To stop the countdown set the countdown time to the current value of the
    countdown (countdown_time = countdown_time - now + serverTimeOffset)
    and set running to False.

    To reset the countdown (it is not a reset in a functional way) just
    change the countdown time. The running value remains False.

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
        if not isinstance(config_data.get('running'), bool):
            raise ProjectorException("Invalid running status. Has to be a boolean.")
        if config_data.get('default') is not None and not isinstance(config_data.get('default'), int):
            raise ProjectorException('Invalid default value. Use integer.')

    @classmethod
    def control(cls, action):
        if action not in ('start', 'stop', 'reset'):
                raise ValueError("Action must be 'start', 'stop' or 'reset', not {}.".format(action))

        # Use the countdown with the lowest index
        projectors = Projector.objects.all()
        lowest_index = None
        if projectors[0]:
            for key, value in projectors[0].config.items():
                if value['name'] == cls.name:
                    if lowest_index is None or value['index'] < lowest_index:
                        lowest_index = value['index']

        if lowest_index is None:
            # create a countdown
            for projector in projectors:
                projector_config = {}
                for key, value in projector.config.items():
                    projector_config[key] = value
                # new countdown
                countdown = {
                    'name': 'core/countdown',
                    'stable': True,
                    'index': 1,
                    'default_time': config['projector_default_countdown'],
                    'visible': False,
                    'selected': True,
                }
                if action == 'start':
                    countdown['running'] = True
                    countdown['countdown_time'] = now().timestamp() + countdown['default_time']
                elif action == 'reset' or action == 'stop':
                    countdown['running'] = False
                    countdown['countdown_time'] = countdown['default_time']
                projector_config[uuid.uuid4().hex] = countdown
                projector.config = projector_config
                projector.save()
        else:
            # search for the countdown and modify it.
            for projector in projectors:
                projector_config = {}
                found = False
                for key, value in projector.config.items():
                    if value['name'] == cls.name and value['index'] == lowest_index:
                        try:
                            cls.validate_config(value)
                        except ProjectorException:
                            # Do not proceed if the specific procjector config data is invalid.
                            # The variable found remains False.
                            break
                        found = True
                        if action == 'start':
                            value['running'] = True
                            value['countdown_time'] = now().timestamp() + value['default_time']
                        elif action == 'stop' and value['running']:
                            value['running'] = False
                            value['countdown_time'] = value['countdown_time'] - now().timestamp()
                        elif action == 'reset':
                            value['running'] = False
                            value['countdown_time'] = value['default_time']
                    projector_config[key] = value
                if found:
                    projector.config = projector_config
                    projector.save()


class Message(ProjectorElement):
    """
    Short message on the projector. Rendered as overlay.
    """
    name = 'core/message'

    def check_data(self):
        if self.config_entry.get('message') is None:
            raise ProjectorException('No message given.')
