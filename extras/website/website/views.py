#from django.views.generic import TemplateView
from django.shortcuts import render_to_response, render
from django.http import HttpResponseRedirect

from website.forms import ContactForm

#class TemplateView(TemplateView):
#    def get_context_data(self, **kwargs):
#        context = super(TemplateView, self).get_context_data(**kwargs)
#        context[request] = self.request
#        return context


def contact(request):
    if request.method == 'POST': # If the form has been submitted...
        form = ContactForm(request.POST) # A form bound to the POST data
        if form.is_valid(): # All validation rules pass
            subject = form.cleaned_data['subject']
            message = form.cleaned_data['message']
            sender = form.cleaned_data['sender']
            cc_myself = form.cleaned_data['cc_myself']
            recipients = ['emanuel@intevation.de']
            if cc_myself:
                recipients.append(sender)

            from django.core.mail import send_mail
            send_mail(subject, message, sender, recipients)
            return HttpResponseRedirect('/demo/') # Redirect after POST
    else:
        form = ContactForm() # An unbound form

    return render(request, 'contact.html', {
        'form': form,
    })
