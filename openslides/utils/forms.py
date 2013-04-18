#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.utils.forms
    ~~~~~~~~~~~~~~~~~~~~~~

    Additional definitions for OpenSlides forms.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

import bleach

from django import forms
from django.views.generic.edit import FormMixin
from django.utils.translation import ugettext_lazy as _


# Allowed tags, attributes and styles allowed in textareas edited with a JS
# editor. Everything not in these whitelists is stripped.
HTML_TAG_WHITELIST = ('a',
                      'i',
                      'em',
                      'b',
                      'strong',
                      'ul',
                      'ol',
                      'li',
                      'p',
                      'br',
                      'span',
                      'strike',
                      'u',
                      'pre',
                      'h1',
                      'h2',
                      'h3',)

HTML_ATTRIBUTES_WHITELIST = {
    '*': ['style'],
    'a': ['href'],
}

HTML_STYLES_WHITELIST = ('text-decoration',)


class CssClassMixin(object):
    error_css_class = 'error'
    required_css_class = 'required'


class LocalizedModelMultipleChoiceField(forms.ModelMultipleChoiceField):
    def __init__(self, *args, **kwargs):
        self.to_field_name = kwargs.get('to_field_name', None)
        super(LocalizedModelMultipleChoiceField, self).__init__(*args, **kwargs)

    def _localized_get_choices(self):
        if hasattr(self, '_choices'):
            return self._choices

        c = []
        for (id, text) in super(LocalizedModelMultipleChoiceField, self)._get_choices():
            text = text.split(' | ')[-1]
            c.append((id, _(text)))
        return c

    choices = property(_localized_get_choices, forms.ChoiceField._set_choices)


class CleanHtmlFormMixin(FormMixin):
    '''
    A form mixin that pre-processes the form, cleaning up the HTML code found
    in the fields in clean_html. All HTML tags, attributes and styles not in the
    whitelists are stripped from the output, leaving only the text content:

    <table><tr><td>foo</td></tr></table> simply becomes 'foo'
    '''

    def get_clean_html_fields(self):
        '''
        the list of elements to strip of potential malicious HTML
        '''
        return()

    def clean(self):
        cleaned_data = super(CleanHtmlFormMixin, self).clean()
        for field in self.get_clean_html_fields():
            cleaned_data[field] = bleach.clean(cleaned_data[field],
                                               tags=HTML_TAG_WHITELIST,
                                               attributes=HTML_ATTRIBUTES_WHITELIST,
                                               styles=HTML_STYLES_WHITELIST,
                                               strip=True)

            # Needed for reportlab
            cleaned_data[field] = cleaned_data[field].replace('<br>', '</br>')
        return cleaned_data
