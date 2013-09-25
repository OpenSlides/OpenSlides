#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    Test the openslides forms.

    :copyright: 2011, 2012, 2013 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django import forms

from openslides.utils.forms import CleanHtmlFormMixin
from openslides.utils.test import TestCase


class HtmlTestForm(CleanHtmlFormMixin, forms.Form):
    text = forms.CharField()
    text2 = forms.CharField()
    clean_html_fields = ('text',)


class CleanHtmlTest(TestCase):
    def clean_html(self, dirty='', clean=False):
        form = HtmlTestForm({'text': dirty, 'text2': dirty})
        form.is_valid()

        # No forbidden HTML-tags, nothing should change
        if not clean:
            self.assertEqual(form.cleaned_data['text'], dirty)

        # Something was removed
        else:
            self.assertEqual(form.cleaned_data['text'], clean)

        # Field text2 has the same content, but is never passed through the
        # HTML-cleanup and should never change
        self.assertEqual(form.cleaned_data['text2'], dirty)

    def test_clean_html(self):
        """
        Test that the correct HTML tags and attributes are removed
        """

        # Forbidden tags and attributes
        self.clean_html('<script>do_evil();</script>', 'do_evil();')
        self.clean_html('<html>evil</html>', 'evil')
        self.clean_html('<p href="evil.com">good?</p>', '<p>good?</p>')
        self.clean_html('<p onclick="javascript:evil();">Not evil</p>', '<p>Not evil</p>')
        self.clean_html('<div style="margin-top: 100000em;">evil</div>', 'evil')
        self.clean_html('<p style="font-weight:bold;">bad</p>', '<p>bad</p>')
        self.clean_html('<table><tbody><tr><td>OK</td></tr></tbody></table>', 'OK')
        self.clean_html('<blockquote>OK</blockquote>', 'OK')
        self.clean_html('<p style="text-decoration: underline;">OK</p>', '<p>OK</p>')

        # Allowed tags and attributes
        self.clean_html('<a href="evil.com">good?</a>')
        self.clean_html('<p>OK</p>')
        self.clean_html('<p><strong>OK</strong></p>')
        self.clean_html('<pre>OK</pre>')
        self.clean_html('<ul><li>OK</li></ul>')
