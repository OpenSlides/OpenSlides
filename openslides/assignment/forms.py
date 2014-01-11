# -*- coding: utf-8 -*-

from django import forms
from django.utils.translation import ugettext_lazy

from openslides.utils.forms import CssClassMixin
from openslides.utils.person import PersonFormField

from .models import Assignment


class AssignmentForm(CssClassMixin, forms.ModelForm):
    posts = forms.IntegerField(
        min_value=1, initial=1, label=ugettext_lazy("Number of available posts"))

    class Meta:
        model = Assignment
        exclude = ('status', 'elected')


class AssignmentRunForm(CssClassMixin, forms.Form):
    candidate = PersonFormField(
        widget=forms.Select(attrs={'class': 'medium-input'}),
        label=ugettext_lazy("Nominate a participant"))
