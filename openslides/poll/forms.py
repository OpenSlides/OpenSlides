# -*- coding: utf-8 -*-

from django import forms

from openslides.utils.forms import CssClassMixin


class OptionForm(CssClassMixin, forms.Form):
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
                required=False)
