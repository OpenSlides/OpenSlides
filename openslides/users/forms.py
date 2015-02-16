from django import forms
from django.conf import settings
from django.utils.translation import ugettext_lazy

from openslides.utils.forms import CssClassMixin

from .models import User


class UsersettingsForm(CssClassMixin, forms.ModelForm):
    class Meta:
        model = User
        fields = ('username', 'title', 'first_name', 'last_name', 'about_me')

    language = forms.ChoiceField(
        choices=settings.LANGUAGES, label=ugettext_lazy('Language'))
