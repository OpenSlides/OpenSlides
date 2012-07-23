from django import forms
from django.utils.translation import ugettext as _

class ContactForm(forms.Form):
    error_css_class = 'error'
    required_css_class = 'required'
    subject = forms.CharField(label=_("Betreff"))
    message = forms.CharField(widget=forms.Textarea(), label=_("Nachricht"))
    sender = forms.EmailField(label=_("Absender"))
    cc_myself = forms.BooleanField(required=False,label=_("Kopie an meine Adresse"))

class OrderEventForm(forms.Form):
    error_css_class = 'error'
    required_css_class = 'required'
    event_name = forms.CharField(label=_("Veranstaltungsname"))
    event_description = forms.CharField(max_length=100, label=_("Kurzbeschreibung der Veranstaltung"))
    event_date = forms.CharField(label=_("Veranstaltungszeitraum"))
    event_location = forms.CharField(label=_("Veranstaltungsort"))

class OrderContactForm(forms.Form):
    error_css_class = 'error'
    required_css_class = 'required'
    contact_organisation = forms.CharField(label=_("Organisation"))
    contact_street = forms.CharField(label=_("Strasse"))
    contact_postcode = forms.CharField(label=_("PLZ"))
    contact_location = forms.CharField(label=_("Ort"))
    contact_name = forms.CharField(label=_("Ansprechpartner"))
    contact_phone = forms.CharField(label=_("Telefon"))
    contact_email = forms.EmailField(label=_("E-Mail"))
