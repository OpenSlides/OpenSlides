#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.poll.models
    ~~~~~~~~~~~~~~~~~~~~~~

    Models for the poll app.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.core.exceptions import ObjectDoesNotExist
from django.db import models
from django.utils.translation import ugettext_lazy as _, ugettext_noop

from openslides.utils.modelfields import MinMaxIntegerField


class BaseOption(models.Model):
    """
    Base option class for a Poll.

    Subclasses have to define a poll-field, which are a subclass of BasePoll.
    """

    def get_votes(self):
        return self.get_vote_class().objects.filter(option=self)

    def __getitem__(self, name):
        try:
            return self.get_votes().get(value=name)
        except self.get_vote_class().DoesNotExist:
            return None

    def get_vote_class(self):
        return self.vote_class

    class Meta:
        abstract = True


class BaseVote(models.Model):
    """
    Base Vote class for an option.

    Subclasses have to define a option-field, which are a subclass of
    BaseOption.
    """
    weight = models.IntegerField(default=1, null=True)  # Use MinMaxIntegerField
    value = models.CharField(max_length=255, null=True)

    def print_weight(self, raw=False):
        if raw:
            return self.weight
        try:
            percent_base = self.option.poll.percent_base()
        except AttributeError:
            # The poll class is no child of CountVotesCast
            percent_base = 0

        return print_value(self.weight, percent_base)

    def get_value(self):
        return _(self.value)

    def __unicode__(self):
        return self.print_weight()

    class Meta:
        abstract = True


class CountVotesCast(models.Model):
    votescast = MinMaxIntegerField(null=True, blank=True, min_value=-2,
                                   verbose_name=_("Votes cast"))

    def append_pollform_fields(self, fields):
        fields.append('votescast')

    def print_votescast(self):
        return print_value(self.votescast)

    def percent_base(self):
        if self.votescast > 0:
            return 100 / float(self.votescast)
        return 0

    class Meta:
        abstract = True


class CountInvalid(models.Model):
    votesinvalid = MinMaxIntegerField(null=True, blank=True, min_value=-2,
                                      verbose_name=_("Votes invalid"))

    def append_pollform_fields(self, fields):
        fields.append('votesinvalid')

    def print_votesinvalid(self):
        try:
            percent_base = self.percent_base()
        except AttributeError:
            # The poll class is no child of CountVotesCast
            percent_base = 0

        return print_value(self.votesinvalid, percent_base)

    class Meta:
        abstract = True


class PublishPollMixin(models.Model):
    published = models.BooleanField(default=False)

    def set_published(self, published):
        self.published = published
        self.save()

    class Meta:
        abstract = True


class BasePoll(models.Model):
    """
    Base poll class.
    """
    vote_values = [ugettext_noop('votes')]

    def has_votes(self):
        """
        Return True, the there are votes in the poll.
        """
        if self.get_votes().exists():
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

    def get_vote_class(self):
        """
        Return the releatet vote class.
        """
        return self.get_option_class().vote_class

    def get_votes(self):
        """
        Return a QuerySet with all vote objects, releatet to this poll.
        """
        return self.get_vote_class().objects.filter(option__poll__id=self.id)

    def set_form_values(self, option, data):
        # TODO: recall this function. It has nothing to do with a form
        """
        Create or update the vote objects for the poll.
        """
        for value in self.get_vote_values():
            try:
                vote = self.get_votes().filter(option=option).get(value=value)
            except ObjectDoesNotExist:
                vote = self.get_vote_class()(option=option, value=value)
            vote.weight = data[value]
            vote.save()

    def get_form_values(self, option_id):
        # TODO: recall this function. It has nothing to do with a form
        """
        Return a the values and the weight of the values as a list with two
        elements.
        """
        values = []
        for value in self.get_vote_values():
            try:
                vote = self.get_votes().filter(option=option_id) \
                    .get(value=value)
                values.append(vote)
            except ObjectDoesNotExist:
                values.append(self.get_vote_class()(value=value, weight=''))
        return values

    def get_vote_form(self, **kwargs):
        """
        Return the form for one option of the poll.
        """
        from openslides.poll.forms import OptionForm
        return OptionForm(extra=self.get_form_values(kwargs['formid']),
                          **kwargs)

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

    class Meta:
        abstract = True


def print_value(value, percent_base=0):

    if value == -1:
        return unicode(_('majority'))
    elif value == -2:
        return unicode(_('undocumented'))
    elif value is None:
        return unicode(_('undocumented'))
    if not percent_base:
        return u'%s' % value

    return u'%d (%.2f %%)' % (value, value * percent_base)
