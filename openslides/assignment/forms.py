from django import forms
from django.utils.translation import ugettext_lazy

from openslides.users.models import User
from openslides.utils.forms import CssClassMixin

from .models import Assignment


class AssignmentForm(CssClassMixin, forms.ModelForm):
    posts = forms.IntegerField(
        min_value=1, initial=1, label=ugettext_lazy("Number of available posts"))

    class Meta:
        model = Assignment
        exclude = ('status', 'elected')


class AssignmentRunForm(CssClassMixin, forms.Form):
    candidate = forms.ModelChoiceField(
        queryset=User.objects.all(),
        widget=forms.Select(attrs={'class': 'medium-input'}),
        label=ugettext_lazy("Nominate a participant"))
