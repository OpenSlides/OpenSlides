# -*- coding: utf-8 -*-

from django.forms.models import modelform_factory
from django.http import HttpResponseRedirect
from django.shortcuts import get_object_or_404

from openslides.utils.views import TemplateView, FormMixin


class PollFormView(FormMixin, TemplateView):
    poll_class = None

    def get(self, request, *args, **kwargs):
        self.poll = self.get_object()
        return super(PollFormView, self).get(request, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        self.poll = self.get_object()
        option_forms = self.poll.get_vote_forms(data=self.request.POST)

        FormClass = self.get_modelform_class()
        pollform = FormClass(data=self.request.POST, instance=self.poll,
                             prefix='pollform')

        error = False
        for form in option_forms:
            if not form.is_valid():
                error = True

        if not pollform.is_valid():
            error = True

        if error:
            response = self.render_to_response(self.get_context_data(
                forms=option_forms,
                pollform=pollform))
        else:
            for form in option_forms:
                data = {}
                for value in self.poll.get_vote_values():
                    data[value] = form.cleaned_data[value]
                self.poll.set_vote_objects_with_values(form.option, data)

            pollform.save()
            response = HttpResponseRedirect(self.get_success_url())
        return response

    def get_poll_class(self):
        if self.poll_class is not None:
            return self.poll_class
        else:
            raise NotImplementedError(
                'No poll class defined. Either provide a poll_class or define '
                'a get_poll_class method.')

    def get_object(self):
        """
        Returns the poll object. Raises Http404 if the poll does not exist.
        """
        try:
            obj = self._object
        except AttributeError:
            queryset = self.get_poll_class().objects.filter(pk=self.kwargs['poll_id'])
            obj = get_object_or_404(queryset)
            self._object = obj
        return obj

    def get_context_data(self, **kwargs):
        context = super(PollFormView, self).get_context_data(**kwargs)
        context['poll'] = self.poll
        if 'forms' in kwargs:
            context['forms'] = kwargs['forms']
            context['pollform'] = kwargs['pollform']
        else:
            context['forms'] = self.poll.get_vote_forms()
            FormClass = self.get_modelform_class()
            context['pollform'] = FormClass(instance=self.poll,
                                            prefix='pollform')
        return context

    def get_modelform_class(self):
        fields = []
        self.poll.append_pollform_fields(fields)
        return modelform_factory(type(self.poll), fields=fields)
