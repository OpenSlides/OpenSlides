#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.agenda.forms
    ~~~~~~~~~~~~~~~~~~~~~~~

    Forms for the agenda app.

    :copyright: 2011 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.forms import Form, ModelForm, IntegerField, ChoiceField, \
                         ModelChoiceField, HiddenInput, Select, TextInput
from django.utils.translation import ugettext as _

from mptt.forms import TreeNodeChoiceField

from utils.forms import CssClassMixin

from agenda.models import Item


class ItemForm(ModelForm, CssClassMixin):
    parent = TreeNodeChoiceField(queryset=Item.objects.all(), label=_("Parent item"), required=False)
    class Meta:
        model = Item
        exclude = ('closed', 'weight', 'releated_sid')


def genweightchoices():
    l = []
    for i in range(-50, 51):
        l.append(('%d' % i, i))
    return l


class ItemOrderForm(Form, CssClassMixin):
    weight = ChoiceField(choices=genweightchoices(),
                         widget=Select(attrs={'class': 'menu-weight'}),
                         label="")
    self = IntegerField(widget=HiddenInput(attrs={'class': 'menu-mlid'}))
    parent = IntegerField(widget=HiddenInput(attrs={'class': 'menu-plid'}))


class ConfigForm(Form, CssClassMixin):
    agenda_countdown_time = IntegerField(widget=TextInput(attrs={'class':'small-input'}),label=_("Countdown (in seconds)"),initial=60, min_value=0)
