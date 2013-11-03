# -*- coding: utf-8 -*-

from openslides.core.widgets import receive_widgets

from .interface import get_personal_info_widget

receive_widgets.connect(get_personal_info_widget, dispatch_uid='personal info widget')
