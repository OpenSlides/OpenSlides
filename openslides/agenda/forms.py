#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.agenda.forms
    ~~~~~~~~~~~~~~~~~~~~~~~

    Forms for the agenda app.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django import forms
from django.utils.translation import ugettext_lazy as _

from mptt.forms import TreeNodeChoiceField

from openslides.utils.forms import CssClassMixin

from openslides.agenda.models import Item


class ItemForm(forms.ModelForm, CssClassMixin):
    """
    Form to create of update an item.
    """
    parent = TreeNodeChoiceField(
        queryset=Item.objects.all(), label=_("Parent item"), required=False)

    class Meta:
        model = Item
        exclude = ('closed', 'weight', 'related_sid')


def gen_weight_choices():
    """
    Creates a list of tuples (n, n) for n from -49 to 50.
    """
    return zip(*(range(-50, 51), range(-50, 51)))


class ItemOrderForm(forms.Form, CssClassMixin):
    """
    Form to change the order of the items.
    """
    weight = forms.ChoiceField(
        choices=gen_weight_choices(),
        widget=forms.Select(attrs={'class': 'menu-weight'}),
    )
    self = forms.IntegerField(
        widget=forms.HiddenInput(attrs={'class': 'menu-mlid'}),
    )
    parent = forms.IntegerField(
        widget=forms.HiddenInput(attrs={'class': 'menu-plid'}),
    )
