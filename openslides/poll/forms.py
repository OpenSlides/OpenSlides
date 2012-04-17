from django import forms
from django.utils.translation import ugettext as _

from utils.forms import CssClassMixin
from models import Vote


class OptionForm(forms.Form, CssClassMixin):
    def __init__(self, *args, **kwargs):
        extra = kwargs.pop('extra')
        formid = kwargs.pop('formid')
        kwargs['prefix'] = "option-%s" % formid
        super(OptionForm, self).__init__(*args, **kwargs)

        for vote in extra:
            if type(vote) is Vote:
                key = vote.value
                value = vote.get_value()
                weight = vote.get_weight()
            else:
                key = vote
                value = _(vote)
                weight = None
            self.fields[key] = forms.IntegerField(
                label=value,
                initial=weight,
            )
