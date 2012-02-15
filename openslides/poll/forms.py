from django import forms
from django.utils.translation import ugettext as _

class OptionForm(forms.Form):
    def __init__(self, *args, **kwargs):
        extra = kwargs.pop('extra')
        formid = kwargs.pop('formid')
        kwargs['prefix'] = "option-%s" % formid
        super(OptionForm, self).__init__(*args, **kwargs)

        for key, value in extra:
            self.fields[key] = forms.IntegerField(
                widget=forms.TextInput(attrs={'class': 'small-input'}),
                label=_(key),
                initial=value,
            )
