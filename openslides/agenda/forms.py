#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.agenda.forms
    ~~~~~~~~~~~~~~~~~~~~~~~

    Forms for the agenda app.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

import re

from django import forms
from django.utils.translation import ugettext_lazy
from mptt.forms import TreeNodeChoiceField

from openslides.utils.forms import CssClassMixin
from .models import Item


class ItemForm(forms.ModelForm, CssClassMixin):
    """
    Form to create of update an item.
    """
    parent = TreeNodeChoiceField(
        queryset=Item.objects.all(), label=ugettext_lazy("Parent item"), required=False)

    duration = forms.RegexField(
        regex=re.compile('[0-99]:[0-5][0-9]'),
        error_message=ugettext_lazy("Invalid format. Hours from 0 to 99 and minutes from 00 to 59"),
        max_length=5,
        required=False,
        label=ugettext_lazy("Duration (hh:mm)"))

    class Meta:
        model = Item
        exclude = ('closed', 'weight', 'related_sid')


def gen_weight_choices():
    """
    Creates a list of tuples (n, n) for n from -49 to 50.
    """
    return zip(*(range(-50, 51), range(-50, 51)))


class ItemOrderForm(CssClassMixin, forms.Form):
    """
    Form to change the order of the items.
    """
    weight = forms.ChoiceField(
        choices=gen_weight_choices(),
        widget=forms.Select(attrs={'class': 'menu-weight'}))
    self = forms.IntegerField(
        widget=forms.HiddenInput(attrs={'class': 'menu-mlid'}))
    parent = forms.IntegerField(
        widget=forms.HiddenInput(attrs={'class': 'menu-plid'}))
