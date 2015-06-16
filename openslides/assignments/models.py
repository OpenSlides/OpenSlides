from django.contrib.contenttypes.fields import GenericRelation
from django.db import models
from django.utils.datastructures import SortedDict
from django.utils.translation import ugettext as _
from django.utils.translation import ugettext_lazy, ugettext_noop

from openslides.agenda.models import Item, Speaker
from openslides.config.api import config
from openslides.core.models import Tag
from openslides.poll.models import (
    BaseOption,
    BasePoll,
    BaseVote,
    CollectDefaultVotesMixin,
    PublishPollMixin,
)
from openslides.projector.models import SlideMixin
from openslides.users.models import User
from openslides.utils.exceptions import OpenSlidesError
from openslides.utils.rest_api import RESTModelMixin


class AssignmentRelatedUser(RESTModelMixin, models.Model):
    """
    Many to Many table between an assignment and user.
    """
    STATUS_CANDIDATE = 1
    STATUS_ELECTED = 2
    STATUS_BLOCKED = 3
    STATUSES = (
        (STATUS_CANDIDATE, ugettext_lazy('candidate')),
        (STATUS_ELECTED, ugettext_lazy('elected')),
        (STATUS_BLOCKED, ugettext_lazy('blocked')),
    )

    assignment = models.ForeignKey(
        'Assignment',
        db_index=True,
        related_name='assignment_related_users')
    user = models.ForeignKey(User, db_index=True)
    status = models.IntegerField(
        choices=STATUSES,
        default=STATUS_CANDIDATE)

    class Meta:
        unique_together = ('assignment', 'user')

    def __str__(self):
        return "%s <-> %s" % (self.assignment, self.user)

    def get_root_rest_element(self):
        """
        Returns the assignment to this instance which is the root REST element.
        """
        return self.assignment


class Assignment(RESTModelMixin, SlideMixin, models.Model):
    slide_callback_name = 'assignment'

    PHASE_SEARCH = 0
    PHASE_VOTING = 1
    PHASE_FINISHED = 2

    PHASES = (
        (PHASE_SEARCH, ugettext_lazy('Searching for candidates')),
        (PHASE_VOTING, ugettext_lazy('Voting')),
        (PHASE_FINISHED, ugettext_lazy('Finished')),
    )

    title = models.CharField(
        max_length=100,
        verbose_name=ugettext_lazy("Title"))
    """
    Title of the assignment.
    """

    description = models.TextField(
        blank=True,
        verbose_name=ugettext_lazy("Description"))
    """
    Text to describe the assignment.
    """

    open_posts = models.PositiveSmallIntegerField(
        verbose_name=ugettext_lazy("Number of members to be elected"))
    """
    The number of members to be elected.
    """

    poll_description_default = models.CharField(
        max_length=79,
        blank=True,
        verbose_name=ugettext_lazy("Default comment on the ballot paper"))
    """
    Default text for the poll description.
    """

    phase = models.IntegerField(
        choices=PHASES,
        default=PHASE_SEARCH)
    """
    Phase in which the assignment is.
    """

    related_users = models.ManyToManyField(
        User,
        through='AssignmentRelatedUser')
    """
    Users that a candidates, elected or blocked as candidate.

    See AssignmentRelatedUser for more infos.
    """

    tags = models.ManyToManyField(Tag, blank=True)
    """
    Tags for the assignment.
    """

    items = GenericRelation(Item)
    """
    Agenda items for this assignment.
    """

    class Meta:
        permissions = (
            ('can_see', ugettext_noop('Can see elections')),
            ('can_nominate_other', ugettext_noop('Can nominate another participant')),
            ('can_nominate_self', ugettext_noop('Can nominate oneself')),
            ('can_manage', ugettext_noop('Can manage elections')),
        )
        ordering = ('title', )
        verbose_name = ugettext_noop('Election')

    def __str__(self):
        return self.title

    def get_slide_context(self, **context):
        """
        Retuns the context to generate the assignment slide.
        """
        return super().get_slide_context(
            polls=self.polls.filter(published=True),
            vote_results=self.vote_results(only_published=True),
            **context)

    @property
    def candidates(self):
        """
        Queryset that represents the candidates for the assignment.
        """
        return self.related_users.filter(
            assignmentrelateduser__status=AssignmentRelatedUser.STATUS_CANDIDATE)

    @property
    def elected(self):
        """
        Queryset that represents all elected users for the assignment.
        """
        return self.related_users.filter(
            assignmentrelateduser__status=AssignmentRelatedUser.STATUS_ELECTED)

    @property
    def blocked(self):
        """
        Queryset that represents all blocked users for the assignment.
        """
        return self.related_users.filter(
            assignmentrelateduser__status=AssignmentRelatedUser.STATUS_BLOCKED)

    def is_candidate(self, user):
        """
        Returns True if user is a candidate.

        Costs one database query.
        """
        return self.candidates.filter(pk=user.pk).exists()

    def is_elected(self, user):
        """
        Returns True if the user is elected for this assignment.

        Costs one database query.
        """
        return self.elected.filter(pk=user.pk).exists()

    def is_blocked(self, user):
        """
        Returns True if the user is blockt for candidature.

        Costs one database query.
        """
        return self.blocked.filter(pk=user.pk).exists()

    def set_candidate(self, user):
        """
        Adds the user as candidate.
        """
        related_user, __ = self.assignment_related_users.update_or_create(
            user=user,
            defaults={'status': AssignmentRelatedUser.STATUS_CANDIDATE})

    def set_elected(self, user):
        """
        Makes user an elected user for this assignment.
        """
        related_user, __ = self.assignment_related_users.update_or_create(
            user=user,
            defaults={'status': AssignmentRelatedUser.STATUS_ELECTED})

    def set_blocked(self, user):
        """
        Block user from this assignment, so he can not get an candidate.
        """
        related_user, __ = self.assignment_related_users.update_or_create(
            user=user,
            defaults={'status': AssignmentRelatedUser.STATUS_BLOCKED})

    def delete_related_user(self, user):
        """
        Delete the connection from the assignment to the user.
        """
        self.assignment_related_users.filter(user=user).delete()

    def set_phase(self, phase):
        """
        Sets the phase attribute of the assignment.

        Raises a ValueError if the phase is not valide.
        """
        if phase not in dict(self.PHASES):
            raise ValueError("Invalid phase %s" % phase)

        self.phase = phase

    def create_poll(self):
        """
        Creates a new poll for the assignment and adds all candidates to all
        lists of speakers of related agenda items.
        """
        candidates = self.candidates.all()

        # Find out the method of the election
        if config['assignment_poll_vote_values'] == 'votes':
            yesnoabstain = False
        elif config['assignment_poll_vote_values'] == 'yesnoabstain':
            yesnoabstain = True
        else:
            # config['assignment_poll_vote_values'] == 'auto'
            # candidates <= available posts -> yes/no/abstain
            if len(candidates) <= (self.open_posts - self.elected.count()):
                yesnoabstain = True
            else:
                yesnoabstain = False

        # Create the poll with the candidates.
        poll = self.polls.create(
            description=self.poll_description_default,
            yesnoabstain=yesnoabstain)
        poll.set_options({'candidate': user} for user in candidates)

        # Add all candidates to all agenda items for this assignment
        # TODO: Try to do this in a bulk create
        for item in self.items.all():
            for candidate in self.candidates:
                try:
                    Speaker.objects.add(candidate, item)
                except OpenSlidesError:
                    # The Speaker is already on the list. Do nothing.
                    # TODO: Find a smart way not to catch the error concerning AnonymousUser.
                    pass

        return poll

    def vote_results(self, only_published):
        """
        Returns a table represented as a list with all candidates from all
        related polls and their vote results.
        """
        vote_results_dict = SortedDict()

        polls = self.polls.all()
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
        return str(self)

    def get_agenda_title_supplement(self):
        return '(%s)' % _('Assignment')


class AssignmentVote(RESTModelMixin, BaseVote):
    option = models.ForeignKey('AssignmentOption')

    def get_root_rest_element(self):
        """
        Returns the assignment to this instance which is the root REST element.
        """
        return self.option.poll.assignment


class AssignmentOption(RESTModelMixin, BaseOption):
    poll = models.ForeignKey('AssignmentPoll')
    candidate = models.ForeignKey(User)
    vote_class = AssignmentVote

    def __str__(self):
        return str(self.candidate)

    def get_root_rest_element(self):
        """
        Returns the assignment to this instance which is the root REST element.
        """
        return self.poll.assignment


class AssignmentPoll(RESTModelMixin, SlideMixin, CollectDefaultVotesMixin,
                     PublishPollMixin, BasePoll):
    slide_callback_name = 'assignmentpoll'
    option_class = AssignmentOption

    assignment = models.ForeignKey(Assignment, related_name='polls')
    yesnoabstain = models.BooleanField(default=False)
    description = models.CharField(
        max_length=79,
        blank=True,
        verbose_name=ugettext_lazy("Comment on the ballot paper"))

    def __str__(self):
        return _("Ballot %d") % self.get_ballot()

    def get_assignment(self):
        return self.assignment

    def get_vote_values(self):
        if self.yesnoabstain:
            return [ugettext_noop('Yes'), ugettext_noop('No'), ugettext_noop('Abstain')]
        else:
            return [ugettext_noop('Votes')]

    def get_ballot(self):
        return self.assignment.polls.filter(id__lte=self.pk).count()

    def get_percent_base_choice(self):
        return config['assignment_poll_100_percent_base']

    def append_pollform_fields(self, fields):
        fields.append('description')
        super().append_pollform_fields(fields)

    def get_slide_context(self, **context):
        return super().get_slide_context(poll=self)

    def get_root_rest_element(self):
        """
        Returns the assignment to this instance which is the root REST element.
        """
        return self.assignment
