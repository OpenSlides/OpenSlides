# -*- coding: utf-8 -*-

from openslides.config.signals import config_signal
from openslides.core.widgets import receive_widgets

from . import slides  # noqa
from .config import get_assignment_config_page
from .interface import get_assignment_widget

config_signal.connect(get_assignment_config_page, dispatch_uid='assignment config page')
receive_widgets.connect(get_assignment_widget, dispatch_uid='assignment widget')
