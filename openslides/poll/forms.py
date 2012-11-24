#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.poll.forms
    ~~~~~~~~~~~~~~~~~~~~~

    Forms for the poll app.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django import forms

from openslides.utils.forms import CssClassMixin


class OptionForm(forms.Form, CssClassMixin):
    def __init__(self, *args, **kwargs):
        extra = kwargs.pop('extra')
        formid = kwargs.pop('formid')
        kwargs['prefix'] = "option-%s" % formid
        super(OptionForm, self).__init__(*args, **kwargs)

        for vote in extra:
            key = vote.value
            value = vote.get_value()
            weight = vote.print_weight(raw=True)
            self.fields[key] = forms.IntegerField(
                label=value,
                initial=weight,
                min_value=-2,
                required=False,
            )
