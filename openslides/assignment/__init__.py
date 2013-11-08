# -*- coding: utf-8 -*-

from openslides.config.signals import config_signal

from . import interface, slides  # noqa
from .config import get_assignment_config_page

config_signal.connect(get_assignment_config_page, dispatch_uid='assignment config page')
