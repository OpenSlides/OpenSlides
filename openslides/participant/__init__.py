# -*- coding: utf-8 -*-

from openslides.config.signals import config_signal
from openslides.core.widgets import receive_widgets

from . import signals, slides  # noqa
from .config import get_participant_config_page
from .interface import get_participant_user_widget, get_participant_group_widget

config_signal.connect(get_participant_config_page, dispatch_uid='participant config page')
receive_widgets.connect(get_participant_user_widget, dispatch_uid='participant user widget')
receive_widgets.connect(get_participant_group_widget, dispatch_uid='participant group widget')
