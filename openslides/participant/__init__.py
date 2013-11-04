# -*- coding: utf-8 -*-

from openslides.config.signals import config_signal

from . import interface, signals, slides  # noqa
from .config import get_participant_config_page

config_signal.connect(get_participant_config_page, dispatch_uid='participant config page')
