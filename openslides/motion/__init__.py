# -*- coding: utf-8 -*-

from openslides.config.signals import config_signal
from openslides.core.widgets import receive_widgets

from . import signals, slides  # noqa
from .config import get_motion_config_page
from .interface import get_motion_widget

config_signal.connect(get_motion_config_page, dispatch_uid='motion config page')
receive_widgets.connect(get_motion_widget, dispatch_uid='motion widget')
