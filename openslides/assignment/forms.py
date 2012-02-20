#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.assignment.forms
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Forms for the assignment app.

    :copyright: 2011 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.forms import ModelForm, Form, ModelChoiceField, Select
from django.utils.translation import ugettext as _

from utils.forms import CssClassMixin
from participant.models import Profile
from assignment.models import Assignment


class AssignmentForm(ModelForm, CssClassMixin):
    class Meta:
        model = Assignment
        exclude = ('status', 'profile', 'elected')


class AssignmentRunForm(Form, CssClassMixin):
    candidate = ModelChoiceField(
        widget=Select(attrs={'class': 'medium-input'}),
        queryset=Profile.objects.all().order_by('user__first_name'),
        label=_("Nominate a participant"),
    )
