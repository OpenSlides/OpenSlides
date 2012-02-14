#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.poll.models
    ~~~~~~~~~~~~~~~~~~~~~~

    Models for the poll app.

    :copyright: 2011 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.db import models
from django.utils.translation import ugettext as _
from django import forms
from django.views.generic import TemplateView
from django.http import HttpResponseRedirect


class OptionForm(forms.Form):
    def __init__(self, *args, **kwargs):
        extra = kwargs.pop('extra')
        formid = kwargs.pop('formid')
        kwargs['prefix'] = "option-%s" % formid
        super(OptionForm, self).__init__(*args, **kwargs)

        for key, value in extra:
            self.fields[key] = forms.IntegerField(
                widget=forms.TextInput(attrs={'class': 'small-input'}),
                label=_(key),
                initial=value,
            )

class BaseOption(models.Model):
    poll = models.ForeignKey('BasePoll')

    @property
    def votes(self):
        count = 0
        for vote in Vote.objects.filter(option=self):
            count += vote.weight
        return weight


class TextOption(BaseOption):
    text = models.CharField(max_length=255)

    def __unicode__(self):
        return self.text


class Vote(models.Model):
    option = models.ForeignKey(BaseOption)
    #profile = models.ForeignKey(Profile) # TODO: we need a person+ here
    weight = models.IntegerField(default=1)
    value = models.CharField(max_length=255, null=True)


class BasePoll(models.Model):
    description = models.TextField(null=True, blank=True, verbose_name = _("Description"))
    votescast = models.IntegerField(null=True, blank=True, verbose_name = _("Votes cast"))
    votesinvalid = models.IntegerField(null=True, blank=True, verbose_name = _("Votes invalid"))

    option_class = TextOption
    vote_values = [_('votes')]

    def set_options(self, options_data):
        for option_data in options_data:
            option = self.option_class(**option_data)
            option.poll = self
            option.save()

    def get_options(self):
        return self.get_option_class().objects.filter(poll=self)

    def get_option_class(self):
        return self.option_class

    def get_vote_values(self):
        return self.vote_values

    def set_form_values(self, option, data):
        for value in self.get_vote_values():
            try:
                vote = Vote.objects.filter(option=option).get(value=value)
            except Vote.DoesNotExist:
                vote = Vote(option=option, value=value)
            vote.weight = data[value]
            vote.save()


    def get_form_values(self, option_id):
        values = []
        for value in self.get_vote_values():
            try:
                vote = Vote.objects.filter(option=option_id).get(value=value)
                weight = vote.weight
            except Vote.DoesNotExist:
                weight = None
            values.append((value, weight))
        return values

    def get_vote_form(self, **kwargs):
        return OptionForm(extra=self.get_form_values(kwargs['formid']), **kwargs)

    def get_vote_forms(self, **kwargs):
        forms = []
        for option in self.get_options():
            form = self.get_vote_form(formid=option.id, **kwargs)
            form.option = option
            forms.append(form)

        return forms


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

