#from django.views.generic import TemplateView
from django.shortcuts import render_to_response, render
from django.http import HttpResponseRedirect

from website.forms import ContactForm, OrderEventForm, OrderContactForm

def contactform(request):
    if request.method == 'POST':
        form = ContactForm(request.POST)
        if form.is_valid():
            subject = form.cleaned_data['subject']
            message = form.cleaned_data['message']
            sender = form.cleaned_data['sender']
            cc_myself = form.cleaned_data['cc_myself']
            recipients = ['emanuel@intevation.de']
            if cc_myself:
                recipients.append(sender)
            from django.core.mail import send_mail
            send_mail(subject, message, sender, recipients)
            return HttpResponseRedirect('/contact/')
    else:
        form = ContactForm()
    return render(request, 'contact-form.html', {
        'form': form,
    })


def orderform(request, package='2'):
    if request.method == 'POST':
        form_event = OrderEventForm(request.POST)
        form_contact = OrderContactForm(request.POST)
        if form_event.is_valid() and form_contact.is_valid():
            # event
            event_name = form_event.cleaned_data['event_name']
            event_description = form_event.cleaned_data['event_description']
            event_date = form_event.cleaned_data['event_date']
            event_location = form_event.cleaned_data['event_location']
            # contact
            contact_name = form_contact.cleaned_data['contact_name']
            contact_phone = form_contact.cleaned_data['contact_phone']
            contact_email = form_contact.cleaned_data['contact_email']
            # mail
            recipients = ['emanuel@intevation.de']
#            recipients.append(contact_email)
            message = "%s" % event_name
            from django.core.mail import send_mail
            send_mail("Bestellung", message, contact_email, recipients)
            return HttpResponseRedirect('/pricing/thanks')
    else:
        form_event = OrderEventForm()
        form_contact = OrderContactForm()
    return render(request, 'order-form.html', {
        'form_event': form_event,
        'form_contact': form_contact,
        'package': package,
    })
