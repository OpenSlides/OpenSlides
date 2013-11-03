# -*- coding: utf-8 -*-

from openslides.config.signals import config_signal
from openslides.core.widgets import receive_widgets

from . import signals, slides  # noqa
from .config import get_agenda_config_page
from .interface import get_agenda_widget, get_list_of_speakers_widget

config_signal.connect(get_agenda_config_page, dispatch_uid='agenda config page')
receive_widgets.connect(get_agenda_widget, dispatch_uid='agenda widget')
receive_widgets.connect(get_list_of_speakers_widget, dispatch_uid='list of speakers widget')
