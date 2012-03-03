#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.assignment.models
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Models for the assignment app.

    :copyright: 2011 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.db import models
from django.utils.translation import ugettext as _

from participant.models import Profile

from projector.models import SlideMixin
from projector.api import register_slidemodel
from poll.models import BasePoll, CountInvalid, CountVotesCast, BaseOption, PublishPollMixin


class Assignment(models.Model, SlideMixin):
    prefix = 'assignment'
    STATUS = (
        ('sea', _('Searching for candidates')),
        ('vot', _('Voting')),
        ('fin', _('Finished')),
    )

    name = models.CharField(max_length=100, verbose_name = _("Name"))
    description = models.TextField(null=True, blank=True, verbose_name = _("Description"))
    posts = models.PositiveSmallIntegerField(verbose_name = _("Number of available posts"))
    polldescription = models.CharField(max_length=100, null=True, blank=True, verbose_name = _("Short description (for ballot paper)"))
    profile = models.ManyToManyField(Profile, null=True, blank=True)
    elected = models.ManyToManyField(Profile, null=True, blank=True, related_name='elected_set')
    status = models.CharField(max_length=1, choices=STATUS, default='sea')

    def set_status(self, status):
        error = True
        for a, b in Assignment.STATUS:
            if status == a:
                error = False
                break
        if error:
            raise NameError(_('%s is not a valid status.') % status)
        if self.status == status:
            raise NameError(_('The assignment status is already %s.') % self.status)
        self.status = status
        self.save()

    def run(self, profile):
        """
        run for a vote
        """
        if self.is_candidate(profile):
            raise NameError(_('<b>%s</b> is already a candidate.') % profile)
        self.profile.add(profile)

    def delrun(self, profile):
        """
        stop running for a vote
        """
        if self.is_candidate(profile):
            self.profile.remove(profile)
        else:
            raise NameError(_('%s is no candidate') % profile)

    def is_candidate(self, profile):
        if profile in self.profile.get_query_set():
            return True
        else:
            return False

    @property
    def candidates(self):
        return self.profile.get_query_set()

    def set_elected(self, profile, value=True):
        if profile in self.candidates:
            if value and not self.is_elected(profile):
                self.elected.add(profile)
            elif not value:
                self.elected.remove(profile)

    def is_elected(self, profile):
        if profile in self.elected.all():
            return True
        return False

    def gen_poll(self):
        poll = AssignmentPoll(assignment=self)
        poll.save()
        poll.set_options([{'candidate': profile} for profile in self.profile.all()])
        return poll

    def slide(self):
        """
        return the slide dict
        """
        data = super(Assignment, self).slide()
        data['assignment'] = self
        data['title'] = self.name
        data['template'] = 'projector/Assignment.html'
        return data

    @models.permalink
    def get_absolute_url(self, link='view'):
        if link == 'view':
            return ('assignment_view', [str(self.id)])
        if link == 'delete':
            return ('assignment_delete', [str(self.id)])

    def __unicode__(self):
        return self.name

    class Meta:
        permissions = (
            ('can_see_assignment', "Can see assignment"),
            ('can_nominate_other', "Can nominate another person"),
            ('can_nominate_self', "Can nominate themselves"),
            ('can_manage_assignment', "Can manage assignment"),
        )

register_slidemodel(Assignment, category=_('Assignment'))


class AssignmentOption(BaseOption):
    candidate = models.ForeignKey(Profile)

    def __unicode__(self):
        return unicode(self.candidate)


class AssignmentPoll(BasePoll, CountInvalid, CountVotesCast, PublishPollMixin):
    option_class = AssignmentOption

    assignment = models.ForeignKey(Assignment, related_name='poll_set')

    def get_assignment(self):
        return self.assignment


    def append_pollform_fields(self, fields):
        CountInvalid.append_pollform_fields(self, fields)
        CountVotesCast.append_pollform_fields(self, fields)

register_slidemodel(AssignmentPoll, category=_('Assignment'))
