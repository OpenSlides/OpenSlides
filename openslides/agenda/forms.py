# -*- coding: utf-8 -*-

import re
from ckeditor.widgets import CKEditorWidget

from django import forms
from django.utils.translation import ugettext_lazy
from mptt.forms import TreeNodeChoiceField

from openslides.utils.forms import CssClassMixin, CleanHtmlFormMixin
from openslides.utils.person.forms import PersonFormField

from .models import Item, Speaker


class ItemForm(CleanHtmlFormMixin, CssClassMixin, forms.ModelForm):
    """
    Form to create of update an item.
    """
    clean_html_fields = ('text', )

    parent = TreeNodeChoiceField(
        queryset=Item.objects.all(), label=ugettext_lazy("Parent item"), required=False)

    duration = forms.RegexField(
        regex=re.compile('^(?:[0-9]{1,2}:[0-5][0-9]|[0-9]+)$'),
        error_message=ugettext_lazy("Invalid format. Hours from 0 to 99 and minutes from 00 to 59"),
        max_length=5,
        required=False,
        label=ugettext_lazy("Duration"),
        help_text=ugettext_lazy('Input format: HH:MM or M or MM or MMM'))

    class Meta:
        model = Item
        fields = ('item_number', 'title', 'text', 'comment', 'tags', 'type', 'duration', 'parent', 'speaker_list_closed')
        widgets = {'text': CKEditorWidget(config_name='images')}


class RelatedItemForm(ItemForm):
    """
    Form to update an related item.
    """
    class Meta:
        model = Item
        fields = ('comment', 'duration', 'parent', 'speaker_list_closed')


class ItemOrderForm(CssClassMixin, forms.Form):
    """
    Form to change the order of the items.
    """
    weight = forms.IntegerField(
        widget=forms.HiddenInput(attrs={'class': 'menu-weight'}))
    self = forms.IntegerField(
        widget=forms.HiddenInput(attrs={'class': 'menu-mlid'}))
    parent = forms.IntegerField(
        widget=forms.HiddenInput(attrs={'class': 'menu-plid'}))


class AppendSpeakerForm(CssClassMixin, forms.Form):
    """
    Form to set an user to a list of speakers.
    """
    speaker = PersonFormField(
        widget=forms.Select(attrs={'class': 'medium-input'}),
        label=ugettext_lazy("Add participant"))

    def __init__(self, item, *args, **kwargs):
        self.item = item
        return super(AppendSpeakerForm, self).__init__(*args, **kwargs)

    def clean_speaker(self):
        """
        Checks, that the user is not already on the list.
        """
        speaker = self.cleaned_data['speaker']
        if Speaker.objects.filter(person=speaker, item=self.item, begin_time=None).exists():
            raise forms.ValidationError(ugettext_lazy(
                '%s is already on the list of speakers.'
                % unicode(speaker)))
        return speaker
