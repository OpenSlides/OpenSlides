from django.core.urlresolvers import reverse
from django.http import HttpResponseRedirect
from django.shortcuts import render_to_response, render

from website.forms import ContactForm, OrderEventForm, OrderContactForm

def contactform(request):
    if request.method == 'POST':
        form = ContactForm(request.POST)
        if form.is_valid():
            subject = form.cleaned_data['subject']
            message = form.cleaned_data['message']
            sender = form.cleaned_data['sender']
            cc_myself = form.cleaned_data['cc_myself']
            recipients = ['support@openslides.org']
            if cc_myself:
                recipients.append(sender)
            from django.core.mail import send_mail
            send_mail(subject, message, sender, recipients)
            return HttpResponseRedirect(reverse('thankscontact'))
    else:
        form = ContactForm()
    return render(request, 'contact-form.html', {
        'form': form,
    })


def orderform(request, package):
    if request.method == 'POST':
        form_event = OrderEventForm(request.POST)
        form_contact = OrderContactForm(request.POST)
        if form_event.is_valid() and form_contact.is_valid():
            # event
            event_name = form_event.cleaned_data['event_name']
            event_description = form_event.cleaned_data['event_description']
            event_date = form_event.cleaned_data['event_date']
            event_location = form_event.cleaned_data['event_location']
            event_participants = form_event.cleaned_data['event_participants']
            # contact
            contact_organisation = form_contact.cleaned_data['contact_organisation']
            contact_street = form_contact.cleaned_data['contact_street']
            contact_postcode = form_contact.cleaned_data['contact_postcode']
            contact_location = form_contact.cleaned_data['contact_location']
            contact_name = form_contact.cleaned_data['contact_name']
            contact_phone = form_contact.cleaned_data['contact_phone']
            contact_email = form_contact.cleaned_data['contact_email']
            # mail
            recipients = ['emanuel@intevation.de']
            message = "Neue Bestellung: OpenSlides Paket #%s\n\n"\
                "Veranstaltungsname: %s\n"\
                "Kurzbeschreibung der Veranstaltung: %s\n"\
                "Veranstaltungszeitraum: %s\n"\
                "Veranstaltungsort: %s\n"\
                "Erwartete Teilnehmer: %s\n\n"\
                "Organisation: %s\n"\
                "Strasse: %s\n"\
                "PLZ: %s\n"\
                "Ort: %s\n"\
                "Ansprechpartner: %s\n"\
                "Telefon: %s\n"\
                "E-Mail: %s\n"\
                % (package, event_name, event_description, event_date, event_location,
                    event_participants, contact_organisation, contact_street,
                    contact_postcode, contact_location, contact_name, contact_phone,
                    contact_email)
            from django.core.mail import send_mail
            send_mail("Bestellung OpenSlides-Supportpaket", message, contact_email, recipients)
            return HttpResponseRedirect(reverse('thanksorder'))

    else:
        form_event = OrderEventForm()
        form_contact = OrderContactForm()
    return render(request, 'order-form.html', {
        'form_event': form_event,
        'form_contact': form_contact,
        'package': package,
    })
