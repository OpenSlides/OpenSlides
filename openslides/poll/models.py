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

from application.models import Application
from assignment.models import Assignment
from participant.models import Profile


class Poll(models.Model):
    optiondecision = models.BooleanField(default=True, verbose_name = _("Poll of decision (yes, no, abstention)"))
    application = models.ForeignKey(Application, null=True, blank=True, verbose_name = _("Application"))
    assignment = models.ForeignKey(Assignment, null=True, blank=True, verbose_name = _("Election"))
    description = models.TextField(null=True, blank=True, verbose_name = _("Description"))
    votescast = models.IntegerField(null=True, blank=True, verbose_name = _("Votes cast"))
    votesinvalid = models.IntegerField(null=True, blank=True, verbose_name = _("Votes invalid"))
    published = models.BooleanField(default=False)

    def add_option(self, option):
        self.save()
        optionc = Option()
        optionc.poll = self
        if isinstance(option, Application):
            optionc.application = option
        elif isinstance(option, Profile):
            optionc.user = option
        else:
            optionc.text = str(option)
        optionc.save()
        return optionc

    @property
    def votescastf(self):
        if self.votescast == -2:
            return _('undocumented')
        elif self.votescast:
            return self.votescast
        return '0'

    @property
    def votesinvalidf(self):
        if self.votesinvalid == -2:
            return _('undocumented')
        elif self.votesinvalid:
            if self.votescast > 0:
                percentage = round(float(self.votesinvalid) / float(self.votescast) * 100,1)
                invalid = "%s (%s %%)" % (str(self.votesinvalid), str(percentage))
                return invalid
            return self.votesinvalid
        return '0'

    def has_vote(self):
        for option in self.options:
            if option.voteyes or option.voteno or option.voteundesided:
                return True
        return False

    def get_options(self):
        return self.option_set.all()

    @property
    def options(self):
        return self.option_set.all()

    @property
    def options_values(self):
        return [option.value for option in self.options]

    def set_published(self, published=True):
        """
        Changes the published-status of the poll.
        """
        self.published = published
        self.save()

    @property
    def count_ballots(self):
        if self.application:
            return Poll.objects.filter(application=self.application).count()
        if self.assignment:
            return Poll.objects.filter(assignment=self.assignment).count()
        return None

    @property
    def ballot(self):
        if self.application:
            counter = 0
            for poll in Poll.objects.filter(application=self.application):
                counter = counter + 1
                if self == poll:
                    return counter
        if self.assignment:
            counter = 0
            for poll in Poll.objects.filter(assignment=self.assignment):
                counter = counter + 1
                if self == poll:
                    return counter
        return None

    @models.permalink
    def get_absolute_url(self, link='view'):
        if self.application:
            if link == 'view':
                return ('application_poll_view', [str(self.id), 0])
            if link == 'delete':
                return ('application_poll_delete', [str(self.id)])
        if self.assignment:
            if link == 'view':
                return ('assignment_poll_view', [str(self.id), 0])
            if link == 'delete':
                return ('assignment_poll_delete', [str(self.id)])
        if link == 'view':
            return ('poll_view', [str(self.id)])
        if link == 'delete':
            return ('poll_delete', [str(self.id)])

    def __unicode__(self):
        if self.application:
            return self.application.title
        if self.assignment:
            return self.assignment.name


class Option(models.Model):
    text = models.CharField(max_length=100, null=True, blank=True, verbose_name = _("Text"))
    user = models.ForeignKey(Profile, null=True, blank=True, verbose_name = _("Participant"))
    application = models.ForeignKey(Application, null=True, blank=True, verbose_name = _("Application"))
    poll = models.ForeignKey(Poll, verbose_name = _("Poll"))
    voteyes = models.IntegerField(null=True, blank=True)
    voteno = models.IntegerField(null=True, blank=True)
    voteundesided = models.IntegerField(null=True, blank=True)

    @property
    def yes(self):
        if self.voteyes == -1:
            return _('majority')
        if self.voteyes == -2:
            return _('undocumented')
        if self.voteyes:
            if self.poll.votescast > 0 and self.voteyes > 0:
                percentage = round(float(self.voteyes) / float(self.poll.votescast) * 100,1)
                return "%s (%s %%)" % (str(self.voteyes), str(percentage))
            return self.voteyes
        return '0'

    @property
    def no(self):
        if self.voteno == -1:
            return _('majority')
        if self.voteno == -2:
            return _('undocumented')
        if self.voteno:
            if self.poll.votescast > 0 and self.voteno > 0:
                percentage = round(float(self.voteno) / float(self.poll.votescast) * 100,1)
                return "%s (%s %%)" % (str(self.voteno), str(percentage))
            return self.voteno
        return '0'

    @property
    def undesided(self):
        if self.voteundesided == -1:
            return _('majority')
        if self.voteundesided == -2:
            return _('undocumented')
        if self.voteundesided:
            if self.poll.votescast > 0 and self.voteundesided > 0:
                percentage = round(float(self.voteundesided) / float(self.poll.votescast) * 100,1)
                return "%s (%s %%)" % (str(self.voteundesided), str(percentage))
            return self.voteundesided
        return '0'

    @property
    def value(self):
        if self.text != "" and self.text is not None:
            return self.text
        if self.user is not None:
            return self.user
        if self.application is not None:
            return self.application
        return None

    def __unicode__(self):
        if self.value:
            return unicode(self.value)
        return _("No options")
