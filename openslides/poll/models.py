#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.poll.models
    ~~~~~~~~~~~~~~~~~~~~~~

    Models for the poll app.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.db import models

from openslides.projector.api import register_slidemodel
from openslides.projector.models import SlideMixin
from openslides.utils.translation_ext import ugettext as _ # TODO
from openslides.utils.modelfields import MinMaxIntegerField


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
    weight = models.IntegerField(default=1, null=True) # Use MinMaxIntegerField
    value = models.CharField(max_length=255, null=True)

    def get_weight(self, raw=False):
        if raw:
            return self.weight
        return print_value(self.weight)

    def get_value(self):
        return unicode(_(self.value))

    def __unicode__(self):
        return self.get_weight()


class CountVotesCast(models.Model):
    votescast = MinMaxIntegerField(null=True, blank=True, min_value=-2, verbose_name=_("Votes cast"))

    def append_pollform_fields(self, fields):
        fields.append('votescast')

    def print_votescast(self):
        return print_value(self.votescast)

    class Meta:
        abstract = True


class CountInvalid(models.Model):
    votesinvalid = MinMaxIntegerField(null=True, blank=True, min_value=-2, verbose_name=_("Votes invalid"))

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
    vote_values = [_('votes', fixstr=True)]

    def has_votes(self):
        """
        Return True, the there are votes in the poll.
        """
        if self.get_options().filter(vote__isnull=False):
            return True
        return False

    def set_options(self, options_data=[]):
        """
        Add new Option pbjects to the poll.

        option_data: A List of arguments for the Option.
        """
        for option_data in options_data:
            option = self.get_option_class()(**option_data)
            option.poll = self
            option.save()

    def get_options(self):
        """
        Return the option objects for the poll.
        """
        return self.get_option_class().objects.filter(poll=self)

    def get_option_class(self):
        """
        Return the option class for the poll. Default is self.option_class.
        """
        return self.option_class

    def get_vote_values(self):
        """
        Return the possible values for the poll as list.
        """
        return self.vote_values

    def set_form_values(self, option, data):
        # TODO: recall this function. It has nothing to do with a form
        """
        Create or update the vote objects for the poll.
        """
        for value in self.get_vote_values():
            try:
                vote = Vote.objects.filter(option=option).get(value=value)
            except Vote.DoesNotExist:
                vote = Vote(option=option, value=value)
            vote.weight = data[value]
            vote.save()

    def get_form_values(self, option_id):
        # TODO: recall this function. It has nothing to do with a form
        """
        Return a the values and the weight of the values as a list with two elements.
        """
        values = []
        for value in self.get_vote_values():
            try:
                vote = Vote.objects.filter(option=option_id).get(value=value)
                values.append(vote)
            except Vote.DoesNotExist:
                values.append(Vote(value=value, weight=''))
        return values

    def get_vote_form(self, **kwargs):
        """
        Return the form for one option of the poll.
        """
        from poll.forms import OptionForm
        return OptionForm(extra=self.get_form_values(kwargs['formid']), **kwargs)

    def get_vote_forms(self, **kwargs):
        """
        Return a list of forms for the poll
        """
        forms = []
        for option in self.get_options():
            form = self.get_vote_form(formid=option.id, **kwargs)
            form.option = option
            forms.append(form)
        return forms

    def slide(self):
        """
        show a Slide for the Poll.
        """
        data = super(BasePoll, self).slide()
        # data['template'] = 'projector/TODO.html'
        return data

    def get_absolute_url(self):
        return ''


def print_value(value):
    if value == -1:
        value = _('majority')
    elif value == -2:
        value = _('undocumented')
    elif value is None:
        value = ''
    return unicode(value)

