# -*- coding: utf-8 -*-

import bleach
from django import forms
from django.utils.translation import ugettext as _
from django.utils.translation import ugettext_lazy

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
                      'h3',
                      'img')

HTML_ATTRIBUTES_WHITELIST = {
    'a': ['href'],
    '*': ['style'],
    'pre': ['class'],
    'img': ['src', 'width', 'height'],
}

HTML_STYLES_WHITELIST = ('color', 'background-color', 'list-style', 'width', 'height')


class CssClassMixin(object):
    error_css_class = 'error'
    required_css_class = 'required'


class LocalizedModelChoiceField(forms.ModelChoiceField):
    """
    Subclass of Django's ModelChoiceField to translate the labels of the
    model's objects.
    """
    def label_from_instance(self, *args, **kwargs):
        """
        Translates the output from Django's label_from_instance method.
        """
        return _(super(LocalizedModelChoiceField, self).label_from_instance(*args, **kwargs))


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
            c.append((id, ugettext_lazy(text)))
        return c

    choices = property(_localized_get_choices, forms.ChoiceField._set_choices)


class CleanHtmlFormMixin(object):
    """
    A form mixin that pre-processes the form, cleaning up the HTML code found
    in the fields in clean_html. All HTML tags, attributes and styles not in the
    whitelists are stripped from the output, leaving only the text content:

    <table><tr><td>foo</td></tr></table> simply becomes 'foo'
    """
    clean_html_fields = ()

    def get_clean_html_fields(self):
        """
        The list of elements to strip of potential malicious HTML.
        """
        return self.clean_html_fields

    def clean(self):
        cleaned_data = super(CleanHtmlFormMixin, self).clean()
        for field in self.get_clean_html_fields():
            try:
                cleaned_data[field] = bleach.clean(
                    cleaned_data[field],
                    tags=HTML_TAG_WHITELIST,
                    attributes=HTML_ATTRIBUTES_WHITELIST,
                    styles=HTML_STYLES_WHITELIST,
                    strip=True)
            except KeyError:
                # The field 'field' is not pressent. Do not change cleaned_data
                pass
        return cleaned_data


class CSVImportForm(CssClassMixin, forms.Form):
    """
    Form for the CSVImportView.
    """
    csvfile = forms.FileField(
        widget=forms.FileInput(attrs={'size': '50'}),
        label=ugettext_lazy('CSV File'),
        help_text=ugettext_lazy('The file has to be encoded in UTF-8.'))
