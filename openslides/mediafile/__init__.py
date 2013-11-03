# -*- coding: utf-8 -*-

from openslides.core.widgets import receive_widgets

from . import slides  # noqa
from .interface import get_mediafile_widget

receive_widgets.connect(get_mediafile_widget, dispatch_uid='mediafile widget')
