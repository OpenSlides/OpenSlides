#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.assignment.models
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Models for the assignment app.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.db import models
from django.core.urlresolvers import reverse

from config.models import config

from participant.models import Profile

from projector.projector import SlideMixin
from projector.api import register_slidemodel
from poll.models import BasePoll, CountInvalid, CountVotesCast, BaseOption, PublishPollMixin
from utils.translation_ext import ugettext as _

from agenda.models import Item


class Assignment(models.Model, SlideMixin):
    prefix = 'assignment'
    STATUS = (
        ('sea', _('Searching for candidates')),
        ('vot', _('Voting')),
        ('fin', _('Finished')),
    )

    name = models.CharField(max_length=100, verbose_name=_("Name"))
    description = models.TextField(null=True, blank=True, verbose_name=_("Description"))
    posts = models.PositiveSmallIntegerField(verbose_name=_("Number of available posts"))
    polldescription = models.CharField(max_length=100, null=True, blank=True, verbose_name=_("Short description (for ballot paper)"))
    profile = models.ManyToManyField(Profile, null=True, blank=True)
    elected = models.ManyToManyField(Profile, null=True, blank=True, related_name='elected_set')
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
        candidates = list(self.profile.all())
        for elected in self.elected.all():
            try:
                candidates.remove(elected)
            except ValueError:
                pass
        poll.set_options([{'candidate': profile} for profile in candidates])
        return poll

    @property
    def vote_results(self):
        votes = []
        publish_winner_results_only = config["assignment_publish_winner_results_only"]
        # list of votes
        votes = []
        for candidate in self.candidates:
            tmplist = [[candidate, self.is_elected(candidate)], []]
            for poll in self.poll_set.all():
                if poll.published:
                    if poll.get_options().filter(candidate=candidate).exists():
                        # check config option 'publish_winner_results_only'
                        if not publish_winner_results_only \
                        or publish_winner_results_only and self.is_elected(candidate):
                            option = AssignmentOption.objects.filter(poll=poll).get(candidate=candidate)
                            try:
                                tmplist[1].append(option.get_votes()[0])
                            except IndexError:
                                tmplist[1].append('–')
                        else:
                            tmplist[1].append("")
                    else:
                        tmplist[1].append("-")
            votes.append(tmplist)
        return votes

    def get_agenda_title(self):
        return self.name

    def delete(self):
        for item in Item.objects.filter(releated_sid=self.sid):
            item.delete()
        super(Assignment, self).delete()

    def slide(self):
        """
        return the slide dict
        """
        data = super(Assignment, self).slide()
        data['assignment'] = self
        data['title'] = self.name
        data['polls'] = self.poll_set.all()
        data['votes'] = self.vote_results
        data['template'] = 'projector/Assignment.html'
        return data

    def get_absolute_url(self, link='view'):
        if link == 'view':
            return reverse('assignment_view', args=(str(self.id)))
        if link == 'edit':
            return reverse('assignment_edit', args=(str(self.id)))
        if link == 'delete':
            return reverse('assignment_delete', args=(str(self.id)))

    def __unicode__(self):
        return self.name

    class Meta:
        permissions = (
            ('can_see_assignment', _("Can see assignment", fixstr=True)),
            ('can_nominate_other', _("Can nominate another person", fixstr=True)),
            ('can_nominate_self', _("Can nominate themselves", fixstr=True)),
            ('can_manage_assignment', _("Can manage assignment", fixstr=True)),
        )

register_slidemodel(Assignment)


class AssignmentOption(BaseOption):
    candidate = models.ForeignKey(Profile)

    def __unicode__(self):
        return unicode(self.candidate)


class AssignmentPoll(BasePoll, CountInvalid, CountVotesCast, PublishPollMixin):
    option_class = AssignmentOption

    assignment = models.ForeignKey(Assignment, related_name='poll_set')
    yesnoababstain = models.NullBooleanField()

    def get_assignment(self):
        return self.assignment

    def get_vote_values(self):
        if not self.yesnoababstain:
            if config['assignment_poll_vote_values'] == 'votes':
                self.yesnoababstain = False
            elif config['assignment_poll_vote_values'] == 'yesnoabstain':
                self.yesnoababstain = True
            else:
                # candidates <= available posts -> yes/no/abstain
                if self.assignment.candidates.count() <= self.assignment.posts - self.assignment.elected.count():
                    self.yesnoababstain = True
                else:
                    self.yesnoababstain = False
            self.save()
        if self.yesnoababstain:
            return [_('Yes', fixstr=True), _('No', fixstr=True), _('Abstain', fixstr=True)]
        else:
            return [_('Votes', fixstr=True)]

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


from django.dispatch import receiver
from openslides.config.signals import default_config_value


@receiver(default_config_value, dispatch_uid="assignment_default_config")
def default_config(sender, key, **kwargs):
    return {
        'assignment_publish_winner_results_only': False,
        'assignment_pdf_ballot_papers_selection': '1',
        'assignment_pdf_ballot_papers_number': '1',
        'assignment_pdf_title': _('Elections'),
        'assignment_pdf_preamble': '',
        'assignment_poll_vote_values': 'auto',
    }.get(key)
