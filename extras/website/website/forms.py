from django import forms

TOPIC_CHOICES = (
    ('question', 'General question'),
    ('bug', 'Bug report'),
    ('reference', 'Add OpenSlides reference'),
)

class ContactForm(forms.Form):
    error_css_class = 'error'
    required_css_class = 'required'
    topic = forms.ChoiceField(choices=TOPIC_CHOICES)
    subject = forms.CharField(max_length=100)
    message = forms.CharField()
    sender = forms.EmailField()
    cc_myself = forms.BooleanField(required=False)

