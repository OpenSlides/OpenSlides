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

from projector.api import register_slidemodel
from projector.models import SlideMixin


class BaseOption(models.Model):
    poll = models.ForeignKey('BasePoll')

    def get_votes(self):
        return Vote.objects.filter(option=self)


class TextOption(BaseOption):
    text = models.CharField(max_length=255)

    def __unicode__(self):
        return self.text


class Vote(models.Model):
    option = models.ForeignKey(BaseOption)
    #profile = models.ForeignKey(Profile) # TODO: we need a person+ here
    weight = models.IntegerField(default=1)
    value = models.CharField(max_length=255, null=True)

    def __unicode__(self):
        return print_value(self.weight)


class CountVotesCast(models.Model):
    votescast = models.IntegerField(null=True, blank=True, verbose_name=_("Votes cast"))

    def append_pollform_fields(self, fields):
        fields.append('votescast')

    def print_votescast(self):
        return print_value(self.votescast)

    class Meta:
        abstract = True


class CountInvalid(models.Model):
    votesinvalid = models.IntegerField(null=True, blank=True, verbose_name=_("Votes invalid"))

    def append_pollform_fields(self, fields):
        fields.append('votesinvalid')

    def print_votesinvalid(self):
        return print_value(self.votesinvalid)

    class Meta:
        abstract = True


class PublishPollMixin(models.Model):
    published = models.BooleanField(default=False)

    def set_published(self, published):
        self.published = published
        self.save()

    class Meta:
        abstract = True


class BasePoll(models.Model, SlideMixin):
    #TODO: It would be nice if this class wouldn't be a subclass from models.Model. But it is needet aslong
    #      BaseOption has a foreignKey on BasePoll
    prefix = 'BasePoll'

    description = models.TextField(null=True, blank=True, verbose_name=_("Description")) #TODO: Use this field or delete it.

    option_class = TextOption
    vote_values = [_('votes')]

    def has_votes(self):
        if self.get_options().filter(vote__isnull=False):
            return True
        return False

    def set_options(self, options_data=[]):
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
        from poll.forms import OptionForm
        return OptionForm(extra=self.get_form_values(kwargs['formid']), **kwargs)

    def get_vote_forms(self, **kwargs):
        forms = []
        for option in self.get_options():
            form = self.get_vote_form(formid=option.id, **kwargs)
            form.option = option
            forms.append(form)
        return forms

    def slide(self):
        data = super(BasePoll, self).slide()
        # data['template'] = 'projector/TODO.html'
        return data

    def get_absolute_url(self):
        return ''


def print_value(value):
    if value == -1:
        return _('majority')
    elif value == -2:
        return _('undocumented')
    return unicode(value)

