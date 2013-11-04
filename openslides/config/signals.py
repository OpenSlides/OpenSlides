# -*- coding: utf-8 -*-

from django.dispatch import Signal

config_signal = Signal(providing_args=[])
"""Signal to get all config tabs from all apps."""
