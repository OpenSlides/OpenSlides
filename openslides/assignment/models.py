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

from openslides.utils.user import UserField

from openslides.config.models import config
from openslides.config.signals import default_config_value

from openslides.projector.api import register_slidemodel
from openslides.projector.projector import SlideMixin

from openslides.poll.models import (BasePoll, CountInvalid, CountVotesCast,
    BaseOption, PublishPollMixin, BaseVote)

from openslides.agenda.models import Item


class AssignmentCandidate(models.Model):
    assignment = models.ForeignKey("Assignment")
    user = UserField(db_index=True)
    elected = models.BooleanField(default=False)

    def __unicode__(self):
        return unicode(self.user)


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
        verbose_name=_("Comment on the ballot paper"))
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

    def run(self, candidate, user=None):
        """
        run for a vote
        """
        # TODO: don't make any permission checks here.
        #       Use other Exceptions
        if self.is_candidate(candidate):
            raise NameError(_('<b>%s</b> is already a candidate.') % candidate)
        if not user.has_perm("assignment.can_manage_assignment") and self.status != 'sea':
            raise NameError(_('The candidate list is already closed.'))
        AssignmentCandidate(assignment=self, user=candidate, elected=False).save()

    def delrun(self, candidate):
        """
        stop running for a vote
        """
        if self.is_candidate(candidate):
            self.assignment_candidats.get(user=candidate).delete()
        else:
            # TODO: Use an OpenSlides Error
            raise Exception(_('%s is no candidate') % candidate)

    def is_candidate(self, user):
        if self.assignment_candidats.filter(user=user).exists():
            return True
        else:
            return False

    @property
    def assignment_candidats(self):
        return AssignmentCandidate.objects.filter(assignment=self)

    @property
    def candidates(self):
        return self.get_participants(only_candidate=True)

    @property
    def elected(self):
        return self.get_participants(only_elected=True)

    def get_participants(self, only_elected=False, only_candidate=False):
        candidates = self.assignment_candidats

        if only_elected and only_candidate:
            # TODO: Use right Exception
            raise Exception("only_elected and only_candidate can not both be Treu")

        if only_elected:
            candidates = candidates.filter(elected=True)

        if only_candidate:
            candidates = candidates.filter(elected=False)

        return [candidate.user for candidate in candidates]
        #for candidate in candidates:
        #    yield candidate.user


    def set_elected(self, user, value=True):
        candidate = self.assignment_candidats.get(user=user)
        candidate.elected = value
        candidate.save()

    def is_elected(self, user):
        return user in self.elected

    def gen_poll(self):
        poll = AssignmentPoll(assignment=self)
        poll.save()
        poll.set_options([{'candidate': user} for user in self.candidates])
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
                        votes[vote.value] = vote.print_weight()
                except AssignmentOption.DoesNotExist:
                    # candidate not in related to this poll
                    votes = None
                vote_results_dict[candidate].append(votes)
        return vote_results_dict


    def get_agenda_title(self):
        return self.name

    def delete(self):
        # Remove any Agenda-Item, which is related to this application.
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


class AssignmentVote(BaseVote):
    option = models.ForeignKey('AssignmentOption')


class AssignmentOption(BaseOption):
    poll = models.ForeignKey('AssignmentPoll')
    candidate = UserField()
    vote_class = AssignmentVote

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
                if self.assignment.assignment_candidats.filter(elected=False).count() <= (self.assignment.posts):
                    self.yesnoabstain = True
                else:
                    self.yesnoabstain = False
            self.save()
        if self.yesnoabstain:
            return [ugettext_noop('Yes'), ugettext_noop('No'),
                ugettext_noop('Abstain')]
        else:
            return [ugettext_noop('Votes')]

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
