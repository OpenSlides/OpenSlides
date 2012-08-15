#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.projector.forms
    ~~~~~~~~~~~~~~~~~~~~~~~~~~

    Forms for the projector app.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django import forms
from django.utils.translation import ugettext_lazy as _

from openslides.utils.forms import CssClassMixin


class SelectWidgetsForm(forms.Form, CssClassMixin):
    """
    Form to select the widgets.
    """
    widget = forms.BooleanField(required=False)
