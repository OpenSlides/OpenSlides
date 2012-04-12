from django import forms
from django.utils.translation import ugettext as _

from utils.forms import CssClassMixin


class OptionForm(forms.Form, CssClassMixin):
    def __init__(self, *args, **kwargs):
        extra = kwargs.pop('extra')
        formid = kwargs.pop('formid')
        kwargs['prefix'] = "option-%s" % formid
        super(OptionForm, self).__init__(*args, **kwargs)

        for key, value in extra:
            self.fields[key] = forms.IntegerField(
                label=_(key),
                initial=value,
            )
