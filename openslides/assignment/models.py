#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.assignment.models
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Models for the assignment app.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.core.urlresolvers import reverse
from django.db import models
from django.dispatch import receiver
from django.utils.translation import ugettext_lazy as _, ugettext_noop

from openslides.config.models import config
from openslides.config.signals import default_config_value

from openslides.projector.api import register_slidemodel
from openslides.projector.projector import SlideMixin

from openslides.participant.models import Profile

from openslides.poll.models import (BasePoll, CountInvalid, CountVotesCast,
    BaseOption, PublishPollMixin)

from agenda.models import Item


class Assignment(models.Model, SlideMixin):
    prefix = 'assignment'
    STATUS = (
        ('sea', _('Searching for candidates')),
        ('vot', _('Voting')),
        ('fin', _('Finished')),
    )

    name = models.CharField(max_length=100, verbose_name=_("Name"))
    description = models.TextField(null=True, blank=True,
        verbose_name=_("Description"))
    posts = models.PositiveSmallIntegerField(
        verbose_name=_("Number of available posts"))
    polldescription = models.CharField(max_length=100, null=True, blank=True,
        verbose_name=_("Short description (for ballot paper)"))
    profile = models.ManyToManyField(Profile, null=True, blank=True)
    elected = models.ManyToManyField(Profile, null=True, blank=True,
        related_name='elected_set')
    status = models.CharField(max_length=3, choices=STATUS, default='sea')

    def set_status(self, status):
        error = True
        for a, b in Assignment.STATUS:
            if status == a:
                error = False
                break
        if error:
            raise NameError(_('%s is not a valid status.') % status)
        if self.status == status:
            raise NameError(_('The assignment status is already %s.')
                % self.status)
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
            self.elected.remove(profile)
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
        candidates = list(self.profile.all())
        for elected in self.elected.all():
            try:
                candidates.remove(elected)
            except ValueError:
                pass
        poll.set_options([{'candidate': profile} for profile in candidates])
        return poll


    def vote_results(self, only_published):
        """
        returns a table represented as a list with all candidates from all
        related polls and their vote results.
        """
        vote_results_dict = {}
        # All polls related to this assigment
        polls = self.poll_set.all()
        if only_published:
            polls = polls.filter(published=True)
        # All PollOption-Objects related to this assignment
        options = []
        for poll in polls:
            options += poll.get_options()

        for option in options:
            candidate = option.candidate
            if candidate in vote_results_dict:
                continue
            vote_results_dict[candidate] = []
            for poll in polls:
                votes = {}
                try:
                    # candidate related to this poll
                    poll_option = poll.get_options().get(candidate=candidate)
                    for vote in poll_option.get_votes():
                        votes[vote.value] = vote.get_weight()
                except AssignmentOption.DoesNotExist:
                    # candidate not in related to this poll
                    votes = None
                vote_results_dict[candidate].append(votes)
        return vote_results_dict


    def get_agenda_title(self):
        return self.name

    def delete(self):
        for item in Item.objects.filter(related_sid=self.sid):
            item.delete()
        super(Assignment, self).delete()

    def slide(self):
        """
        return the slide dict
        """
        data = super(Assignment, self).slide()
        data['assignment'] = self
        data['title'] = self.name
        data['polls'] = self.poll_set.filter(published=True)
        data['vote_results'] = self.vote_results(only_published=True)
        data['assignment_publish_winner_results_only'] = \
            config['assignment_publish_winner_results_only']
        data['template'] = 'projector/Assignment.html'
        return data

    def get_absolute_url(self, link='view'):
        if link == 'view':
            return reverse('assignment_view', args=[str(self.id)])
        if link == 'edit':
            return reverse('assignment_edit', args=[str(self.id)])
        if link == 'delete':
            return reverse('assignment_delete', args=[str(self.id)])

    def __unicode__(self):
        return self.name

    class Meta:
        permissions = (
            ('can_see_assignment', ugettext_noop("Can see assignment")),
            ('can_nominate_other',
                ugettext_noop("Can nominate another person")),
            ('can_nominate_self', ugettext_noop("Can nominate themselves")),
            ('can_manage_assignment', ugettext_noop("Can manage assignment")),
        )

register_slidemodel(Assignment)


class AssignmentOption(BaseOption):
    candidate = models.ForeignKey(Profile)

    def __unicode__(self):
        return unicode(self.candidate)


class AssignmentPoll(BasePoll, CountInvalid, CountVotesCast, PublishPollMixin):
    option_class = AssignmentOption

    assignment = models.ForeignKey(Assignment, related_name='poll_set')
    yesnoabstain = models.NullBooleanField()

    def get_assignment(self):
        return self.assignment

    def get_vote_values(self):
        if self.yesnoabstain is None:
            if config['assignment_poll_vote_values'] == 'votes':
                self.yesnoabstain = False
            elif config['assignment_poll_vote_values'] == 'yesnoabstain':
                self.yesnoabstain = True
            else:
                # candidates <= available posts -> yes/no/abstain
                if self.assignment.candidates.count() <= (self.assignment.posts
                        - self.assignment.elected.count()):
                    self.yesnoabstain = True
                else:
                    self.yesnoabstain = False
            self.save()
        if self.yesnoabstain:
            return [_('Yes'), _('No'), _('Abstain')]
        else:
            return [_('Votes')]

    def append_pollform_fields(self, fields):
        CountInvalid.append_pollform_fields(self, fields)
        CountVotesCast.append_pollform_fields(self, fields)

    def get_ballot(self):
        return self.assignment.poll_set.filter(id__lte=self.id).count()

    @models.permalink
    def get_absolute_url(self, link='view'):
        if link == 'view':
            return ('assignment_poll_view', [str(self.id)])
        if link == 'delete':
            return ('assignment_poll_delete', [str(self.id)])

    def __unicode__(self):
        return _("Ballot %d") % self.get_ballot()




@receiver(default_config_value, dispatch_uid="assignment_default_config")
def default_config(sender, key, **kwargs):
    return {
        'assignment_publish_winner_results_only': False,
        'assignment_pdf_ballot_papers_selection': 'CUSTOM_NUMBER',
        'assignment_pdf_ballot_papers_number': '8',
        'assignment_pdf_title': _('Elections'),
        'assignment_pdf_preamble': '',
        'assignment_poll_vote_values': 'auto',
    }.get(key)
