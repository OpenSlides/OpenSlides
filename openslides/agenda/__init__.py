# -*- coding: utf-8 -*-

from openslides.config.signals import config_signal

from . import interface, signals, slides  # noqa
from .config import get_agenda_config_page

config_signal.connect(get_agenda_config_page, dispatch_uid='agenda config page')
