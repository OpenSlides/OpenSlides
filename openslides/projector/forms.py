# -*- coding: utf-8 -*-

from django import forms

from openslides.utils.forms import CssClassMixin


class SelectWidgetsForm(CssClassMixin, forms.Form):
    """
    Form to select the widgets.
    """
    widget = forms.BooleanField(required=False)
