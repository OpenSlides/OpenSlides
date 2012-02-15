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

#from projector.api import register_slidemodel
#from projector.models import Slide


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


class BasePoll(models.Model): #, Slide):
    prefix = 'BasePoll'

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


#register_slidemodel(BasePoll)

