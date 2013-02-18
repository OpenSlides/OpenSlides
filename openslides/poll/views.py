#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.poll.views
    ~~~~~~~~~~~~~~~~~~~~~

    Views for the poll app.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.http import HttpResponseRedirect
from django.forms.models import modelform_factory
from django.core.exceptions import ImproperlyConfigured

from openslides.utils.views import TemplateView, UrlMixin


class PollFormView(UrlMixin, TemplateView):
    poll_class = None

    def get(self, request, *args, **kwargs):
        self.poll = self.object = self.get_object()
        return super(PollFormView, self).get(request, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        self.poll = self.object = self.get_object()
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
            return self.render_to_response(self.get_context_data(
                forms=option_forms,
                pollform=pollform,
            ))

        for form in option_forms:
            data = {}
            for value in self.poll.get_vote_values():
                data[value] = form.cleaned_data[value]
            self.poll.set_form_values(form.option, data)

        pollform.save()
        return HttpResponseRedirect(self.get_success_url())

    def get_poll_class(self):
        if self.poll_class is not None:
            return self.poll_class
        else:
            raise ImproperlyConfigured(
                "No poll class defined.  Either provide a poll_class or define"
                " a get_poll_class method.")

    def get_object(self):
        return self.get_poll_class().objects.get(pk=self.kwargs['poll_id'])

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
        return modelform_factory(self.poll.__class__, fields=fields)
