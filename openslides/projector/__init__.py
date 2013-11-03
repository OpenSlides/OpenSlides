# -*- coding: utf-8 -*-

from openslides.config.signals import config_signal
from openslides.core.widgets import receive_widgets

from . import signals, slides  # noqa
from .config import get_projector_config_page
from .interface import (get_projector_welcome_widget, get_projector_live_widget,
                        get_projector_overlay_widget, get_projector_custom_slide_widget)

config_signal.connect(get_projector_config_page, dispatch_uid='projector config page')
receive_widgets.connect(get_projector_welcome_widget, dispatch_uid='projector welcome widget')
receive_widgets.connect(get_projector_live_widget, dispatch_uid='projector live widget')
receive_widgets.connect(get_projector_overlay_widget, dispatch_uid='projector overlay widget')
receive_widgets.connect(get_projector_custom_slide_widget, dispatch_uid='projector custom slide widget')
