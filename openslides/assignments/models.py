from collections import OrderedDict
from typing import Any, Dict, List

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from openslides.agenda.mixins import AgendaItemWithListOfSpeakersMixin
from openslides.agenda.models import Speaker
from openslides.core.config import config
from openslides.core.models import Tag
from openslides.mediafiles.models import Mediafile
from openslides.poll.models import BaseOption, BasePoll, BaseVote
from openslides.utils.autoupdate import inform_changed_data
from openslides.utils.exceptions import OpenSlidesError
from openslides.utils.models import RESTModelMixin

from ..utils.models import CASCADE_AND_AUTOUPDATE, SET_NULL_AND_AUTOUPDATE
from .access_permissions import (
    AssignmentAccessPermissions,
    AssignmentPollAccessPermissions,
)


class AssignmentRelatedUser(RESTModelMixin, models.Model):
    """
    Many to Many table between an assignment and user.
    """

    assignment = models.ForeignKey(
        "Assignment", on_delete=models.CASCADE, related_name="assignment_related_users"
    )
    """
    ForeinKey to the assignment.
    """

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=CASCADE_AND_AUTOUPDATE)
    """
    ForeinKey to the user who is related to the assignment.
    """

    elected = models.BooleanField(default=False)
    """
    Saves the election state of each user
    """

    weight = models.IntegerField(default=0)
    """
    The sort order of the candidates.
    """

    class Meta:
        default_permissions = ()
        unique_together = ("assignment", "user")

    def __str__(self):
        return f"{self.assignment} <-> {self.user}"

    def get_root_rest_element(self):
        """
        Returns the assignment to this instance which is the root REST element.
        """
        return self.assignment


class AssignmentManager(models.Manager):
    """
    Customized model manager to support our get_full_queryset method.
    """

    def get_full_queryset(self):
        """
        Returns the normal queryset with all assignments. In the background
        all related users (candidates), the related agenda item and all
        polls are prefetched from the database.
        """
        return self.get_queryset().prefetch_related(
            "related_users",
            "agenda_items",
            "lists_of_speakers",
            "polls",
            "tags",
            "attachments",
        )


class Assignment(RESTModelMixin, AgendaItemWithListOfSpeakersMixin, models.Model):
    """
    Model for assignments.
    """

    access_permissions = AssignmentAccessPermissions()
    can_see_permission = "assignments.can_see"

    objects = AssignmentManager()

    PHASE_SEARCH = 0
    PHASE_VOTING = 1
    PHASE_FINISHED = 2

    PHASES = (
        (PHASE_SEARCH, "Searching for candidates"),
        (PHASE_VOTING, "Voting"),
        (PHASE_FINISHED, "Finished"),
    )

    title = models.CharField(max_length=100)
    """
    Title of the assignment.
    """

    description = models.TextField(blank=True)
    """
    Text to describe the assignment.
    """

    open_posts = models.PositiveSmallIntegerField()
    """
    The number of members to be elected.
    """

    poll_description_default = models.CharField(max_length=79, blank=True)
    """
    Default text for the poll description.
    """

    phase = models.IntegerField(choices=PHASES, default=PHASE_SEARCH)
    """
    Phase in which the assignment is.
    """

    related_users = models.ManyToManyField(
        settings.AUTH_USER_MODEL, through="AssignmentRelatedUser"
    )
    """
    Users that are candidates or elected.

    See AssignmentRelatedUser for more information.
    """

    tags = models.ManyToManyField(Tag, blank=True)
    """
    Tags for the assignment.
    """

    attachments = models.ManyToManyField(Mediafile, blank=True)
    """
    Mediafiles as attachments for this assignment.
    """

    class Meta:
        default_permissions = ()
        permissions = (
            ("can_see", "Can see elections"),
            ("can_nominate_other", "Can nominate another participant"),
            ("can_nominate_self", "Can nominate oneself"),
            ("can_manage", "Can manage elections"),
        )
        ordering = ("title",)
        verbose_name = "Election"

    def __str__(self):
        return self.title

    @property
    def candidates(self):
        """
        Queryset that represents the candidates for the assignment.
        """
        return self.related_users.filter(assignmentrelateduser__elected=False)

    @property
    def elected(self):
        """
        Queryset that represents all elected users for the assignment.
        """
        return self.related_users.filter(assignmentrelateduser__elected=True)

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

    def add_candidate(self, user):
        """
        Adds the user as candidate.
        """
        weight = (
            self.assignment_related_users.aggregate(models.Max("weight"))["weight__max"]
            or 0
        )
        defaults = {"elected": False, "weight": weight + 1}
        self.assignment_related_users.update_or_create(user=user, defaults=defaults)

    def set_elected(self, user):
        """
        Makes user an elected user for this assignment.
        """
        self.assignment_related_users.update_or_create(
            user=user, defaults={"elected": True}
        )

    def remove_candidate(self, user):
        """
        Delete the connection from the assignment to the user.
        """
        self.assignment_related_users.filter(user=user).delete()
        inform_changed_data(self)

    def set_phase(self, phase):
        """
        Sets the phase attribute of the assignment.

        Raises a ValueError if the phase is not valide.
        """
        if phase not in dict(self.PHASES):
            raise ValueError(f"Invalid phase {phase}")

        self.phase = phase

    def vote_results(self, only_published):
        """
        Returns a table represented as a list with all candidates from all
        related polls and their vote results.
        """
        vote_results_dict: Dict[Any, List[AssignmentVote]] = OrderedDict()

        polls = self.polls.all()
        if only_published:
            polls = polls.filter(published=True)

        # All PollOption-Objects related to this assignment
        options: List[AssignmentOption] = []
        for poll in polls:
            options += poll.get_options()

        for option in options:
            candidate = option.candidate
            if candidate in vote_results_dict:
                continue
            vote_results_dict[candidate] = []
            for poll in polls:
                votes: Any = {}
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

    def get_title_information(self):
        return {"title": self.title}


class AssignmentVote(RESTModelMixin, BaseVote):
    option = models.ForeignKey(
        "AssignmentOption", on_delete=models.CASCADE, related_name="votes"
    )

    class Meta:
        default_permissions = ()


class AssignmentOption(RESTModelMixin, BaseOption):
    vote_class = AssignmentVote

    poll = models.ForeignKey(
        "AssignmentPoll", on_delete=models.CASCADE, related_name="options"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=SET_NULL_AND_AUTOUPDATE, null=True
    )
    weight = models.IntegerField(default=0)

    class Meta:
        default_permissions = ()

    def get_root_rest_element(self):
        return self.poll


# Meta-TODO: Is this todo resolved?
# TODO: remove the type-ignoring in the next line, after this is solved:
#       https://github.com/python/mypy/issues/3855
class AssignmentPoll(RESTModelMixin, BasePoll):
    access_permissions = AssignmentPollAccessPermissions()
    option_class = AssignmentOption

    assignment = models.ForeignKey(
        Assignment, on_delete=models.CASCADE, related_name="polls"
    )

    POLLMETHOD_YN = "YN"
    POLLMETHOD_YNA = "YNA"
    POLLMETHOD_VOTES = "votes"
    POLLMETHODS = (("YN", "YN"), ("YNA", "YNA"), ("votes", "votes"))
    pollmethod = models.CharField(max_length=5, choices=POLLMETHODS)

    global_abstain = models.BooleanField(default=True)
    global_no = models.BooleanField(default=True)

    votes_amount = models.IntegerField(default=1, validators=[MinValueValidator(1)])
    """ For "votes" mode: The amount of votes a voter can give. """

    allow_multiple_votes_per_candidate = models.BooleanField(default=False)

    class Meta:
        default_permissions = ()

    def create_options(self):
        related_users = AssignmentRelatedUser.objects.filter(
            assignment__id=self.assignment.id
        ).exclude(elected=True)
        options = [
            AssignmentOption(
                user=related_user.user, weight=related_user.weight, poll=self
            )
            for related_user in related_users
        ]
        AssignmentOption.objects.bulk_create(options)
        inform_changed_data(self)

        # Add all candidates to list of speakers of related agenda item
        if config["assignments_add_candidates_to_list_of_speakers"]:
            for related_user in related_users:
                try:
                    Speaker.objects.add(
                        related_user.user,
                        self.assignment.list_of_speakers,
                        skip_autoupdate=True,
                    )
                except OpenSlidesError:
                    # The Speaker is already on the list. Do nothing.
                    pass
            inform_changed_data(self.assignment.list_of_speakers)
