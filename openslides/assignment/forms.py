#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.assignment.forms
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Forms for the assignment app.

    :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django import forms
from django.utils.translation import ugettext_lazy

from openslides.utils.forms import CssClassMixin
from openslides.utils.person import PersonFormField

from openslides.assignment.models import Assignment


class AssignmentForm(forms.ModelForm, CssClassMixin):
    posts = forms.IntegerField(
        min_value=1, initial=1, label=ugettext_lazy("Number of available posts"))

    class Meta:
        model = Assignment
        exclude = ('status', 'elected')


class AssignmentRunForm(forms.Form, CssClassMixin):
    candidate = PersonFormField(
        widget=forms.Select(attrs={'class': 'medium-input'}),
        label=ugettext_lazy("Nominate a participant"),
    )
