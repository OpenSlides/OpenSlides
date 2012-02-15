from django.views.generic import TemplateView
from django.http import HttpResponseRedirect

class PollFormView(TemplateView):
    template_name = 'poll/poll.html'
    poll_argument = 'poll_id'

    def set_poll(self, poll_id):
        poll_id = poll_id
        self.poll = self.poll_class.objects.get(pk=poll_id)
        self.poll.vote_values = self.vote_values

    def get_context_data(self, **kwargs):
        context = super(PollFormView, self).get_context_data(**kwargs)
        self.set_poll(self.kwargs['poll_id'])
        context['poll'] = self.poll
        if not 'forms' in context:
            context['forms'] = context['poll'].get_vote_forms()
        return context

    def get_success_url(self):
        return self.success_url

    def post(self, request, *args, **kwargs):
        context = self.get_context_data(**kwargs)
        forms = self.poll.get_vote_forms(data=self.request.POST)
        error = False
        for form in forms:
            if not form.is_valid():
                error = True
        if error:
            return self.render_to_response(self.get_context_data(forms=forms))

        for form in forms:
            data = {}
            for value in self.poll.vote_values:
                data[value] = form.cleaned_data[value]
            print data
            self.poll.set_form_values(form.option, data)
        return HttpResponseRedirect(self.get_success_url())
