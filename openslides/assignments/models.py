from collections import OrderedDict

from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils.translation import ugettext as _
from django.utils.translation import ugettext_lazy, ugettext_noop

from openslides.agenda.models import Item, Speaker
from openslides.core.config import config
from openslides.core.models import Tag
from openslides.poll.models import (
    BaseOption,
    BasePoll,
    BaseVote,
    CollectDefaultVotesMixin,
    PublishPollMixin,
)
from openslides.utils.exceptions import OpenSlidesError
from openslides.utils.models import RESTModelMixin
from openslides.utils.search import user_name_helper

from .access_permissions import AssignmentAccessPermissions


class AssignmentRelatedUser(RESTModelMixin, models.Model):
    """
    Many to Many table between an assignment and user.
    """
    assignment = models.ForeignKey(
        'Assignment',
        on_delete=models.CASCADE,
        related_name='assignment_related_users')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE)
    elected = models.BooleanField(default=False)

    class Meta:
        default_permissions = ()
        unique_together = ('assignment', 'user')

    def __str__(self):
        return "%s <-> %s" % (self.assignment, self.user)

    def get_root_rest_element(self):
        """
        Returns the assignment to this instance which is the root REST element.
        """
        return self.assignment


class Assignment(RESTModelMixin, models.Model):
    """
    Model for assignments.
    """
    access_permissions = AssignmentAccessPermissions()

    PHASE_SEARCH = 0
    PHASE_VOTING = 1
    PHASE_FINISHED = 2

    PHASES = (
        (PHASE_SEARCH, ugettext_lazy('Searching for candidates')),
        (PHASE_VOTING, ugettext_lazy('Voting')),
        (PHASE_FINISHED, ugettext_lazy('Finished')),
    )

    title = models.CharField(
        max_length=100)
    """
    Title of the assignment.
    """

    description = models.TextField(
        blank=True)
    """
    Text to describe the assignment.
    """

    open_posts = models.PositiveSmallIntegerField()
    """
    The number of members to be elected.
    """

    poll_description_default = models.CharField(
        max_length=79,
        blank=True)
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
        settings.AUTH_USER_MODEL,
        through='AssignmentRelatedUser')
    """
    Users that are candidates or elected.

    See AssignmentRelatedUser for more information.
    """

    tags = models.ManyToManyField(Tag, blank=True)
    """
    Tags for the assignment.
    """

    class Meta:
        default_permissions = ()
        permissions = (
            ('can_see', 'Can see elections'),
            ('can_nominate_other', 'Can nominate another participant'),
            ('can_nominate_self', 'Can nominate oneself'),
            ('can_manage', 'Can manage elections'),
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
            assignmentrelateduser__elected=False)

    @property
    def elected(self):
        """
        Queryset that represents all elected users for the assignment.
        """
        return self.related_users.filter(
            assignmentrelateduser__elected=True)

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

    def set_candidate(self, user):
        """
        Adds the user as candidate.
        """
        related_user, __ = self.assignment_related_users.update_or_create(
            user=user,
            defaults={'elected': False})

    def set_elected(self, user):
        """
        Makes user an elected user for this assignment.
        """
        related_user, __ = self.assignment_related_users.update_or_create(
            user=user,
            defaults={'elected': True})

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
        if config['assignments_poll_vote_values'] == 'votes':
            yesnoabstain = False
        elif config['assignments_poll_vote_values'] == 'yesnoabstain':
            yesnoabstain = True
        else:
            # config['assignments_poll_vote_values'] == 'auto'
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

        # Add all candidates to list of speakers of related agenda item
        # TODO: Try to do this in a bulk create
        for candidate in self.candidates:
            try:
                Speaker.objects.add(candidate, self.agenda_item)
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
        vote_results_dict = OrderedDict()

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

    def get_agenda_list_view_title(self):
        """
        Return a title string for the agenda list view.

        Contains agenda item number, title and assignment verbose name.
        Note: It has to be the same return value like in JavaScript.
        """
        return '%s (%s)' % (self.title, _(self._meta.verbose_name))

    @property
    def agenda_item(self):
        """
        Returns the related agenda item.
        """
        content_type = ContentType.objects.get_for_model(self)
        return Item.objects.get(object_id=self.pk, content_type=content_type)

    @property
    def agenda_item_id(self):
        """
        Returns the id of the agenda item object related to this object.
        """
        return self.agenda_item.pk

    def get_search_index_string(self):
        """
        Returns a string that can be indexed for the search.
        """
        return " ".join((
            self.title,
            self.description,
            user_name_helper(self.related_users.all()),
            " ".join(tag.name for tag in self.tags.all())))


class AssignmentVote(RESTModelMixin, BaseVote):
    option = models.ForeignKey(
        'AssignmentOption',
        on_delete=models.CASCADE,
        related_name='votes')

    class Meta:
        default_permissions = ()

    def get_root_rest_element(self):
        """
        Returns the assignment to this instance which is the root REST element.
        """
        return self.option.poll.assignment


class AssignmentOption(RESTModelMixin, BaseOption):
    poll = models.ForeignKey(
        'AssignmentPoll',
        on_delete=models.CASCADE,
        related_name='options')
    candidate = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE)
    vote_class = AssignmentVote

    class Meta:
        default_permissions = ()

    def __str__(self):
        return str(self.candidate)

    def get_root_rest_element(self):
        """
        Returns the assignment to this instance which is the root REST element.
        """
        return self.poll.assignment


class AssignmentPoll(RESTModelMixin, CollectDefaultVotesMixin,
                     PublishPollMixin, BasePoll):
    option_class = AssignmentOption

    assignment = models.ForeignKey(
        Assignment,
        on_delete=models.CASCADE,
        related_name='polls')
    yesnoabstain = models.BooleanField(default=False)
    description = models.CharField(
        max_length=79,
        blank=True)

    class Meta:
        default_permissions = ()

    def get_assignment(self):
        return self.assignment

    def get_vote_values(self):
        if self.yesnoabstain:
            return ['Yes', 'No', 'Abstain']
        else:
            return ['Votes']

    def get_ballot(self):
        return self.assignment.polls.filter(id__lte=self.pk).count()

    def get_percent_base_choice(self):
        return config['assignments_poll_100_percent_base']

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
