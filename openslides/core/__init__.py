# -*- coding: utf-8 -*-

from openslides.config.signals import config_signal

from . import signals  # noqa
from .config import get_general_config_page

config_signal.connect(get_general_config_page, dispatch_uid='general config page')
