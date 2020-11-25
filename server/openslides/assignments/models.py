from decimal import Decimal

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
from openslides.utils.manager import BaseManager
from openslides.utils.models import RESTModelMixin

from ..utils.models import CASCADE_AND_AUTOUPDATE, SET_NULL_AND_AUTOUPDATE
from .access_permissions import (
    AssignmentAccessPermissions,
    AssignmentOptionAccessPermissions,
    AssignmentPollAccessPermissions,
    AssignmentVoteAccessPermissions,
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


class AssignmentManager(BaseManager):
    """
    Customized model manager to support our get_prefetched_queryset method.
    """

    def get_prefetched_queryset(self, *args, **kwargs):
        """
        Returns the normal queryset with all assignments. In the background
        all related users (candidates), the related agenda item and all
        polls are prefetched from the database.
        """

        return (
            super()
            .get_prefetched_queryset(*args, **kwargs)
            .prefetch_related(
                "assignment_related_users",
                "agenda_items",
                "lists_of_speakers",
                "tags",
                "attachments",
                "polls",
                "polls__options",
            )
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

    default_poll_description = models.CharField(max_length=255, blank=True)
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
    Users that are candidates.

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

    number_poll_candidates = models.BooleanField(default=False)
    """
    Controls whether the candidates in polls for this assignment should be numbered or listed with bullet points.
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
        return self.related_users.all()

    def is_candidate(self, user):
        """
        Returns True if user is a candidate.

        Costs one database query.
        """
        return self.candidates.filter(pk=user.pk).exists()

    def add_candidate(self, user):
        """
        Adds the user as candidate.
        """
        weight = (
            self.assignment_related_users.aggregate(models.Max("weight"))["weight__max"]
            or 0
        )
        defaults = {"weight": weight + 1}
        self.assignment_related_users.update_or_create(user=user, defaults=defaults)

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

    def get_title_information(self):
        return {"title": self.title}


class AssignmentVoteManager(BaseManager):
    """
    Customized model manager to support our get_prefetched_queryset method.
    """

    def get_prefetched_queryset(self, *args, **kwargs):
        """
        Returns the normal queryset with all assignment votes. In the background we
        join and prefetch all related models.
        """
        return (
            super()
            .get_prefetched_queryset(*args, **kwargs)
            .select_related("user", "option", "option__poll")
        )


class AssignmentVote(RESTModelMixin, BaseVote):
    access_permissions = AssignmentVoteAccessPermissions()
    objects = AssignmentVoteManager()

    option = models.ForeignKey(
        "AssignmentOption", on_delete=CASCADE_AND_AUTOUPDATE, related_name="votes"
    )

    class Meta:
        default_permissions = ()
        unique_together = ("user", "option")


class AssignmentOptionManager(BaseManager):
    """
    Customized model manager to support our get_prefetched_queryset method.
    """

    def get_prefetched_queryset(self, *args, **kwargs):
        """
        Returns the normal queryset. In the background we
        join and prefetch all related models.
        """
        return (
            super()
            .get_prefetched_queryset(*args, **kwargs)
            .select_related("user", "poll")
            .prefetch_related("votes")
        )


class AssignmentOption(RESTModelMixin, BaseOption):
    access_permissions = AssignmentOptionAccessPermissions()
    can_see_permission = "assignments.can_see"
    objects = AssignmentOptionManager()
    vote_class = AssignmentVote

    poll = models.ForeignKey(
        "AssignmentPoll", on_delete=CASCADE_AND_AUTOUPDATE, related_name="options"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=SET_NULL_AND_AUTOUPDATE, null=True
    )
    weight = models.IntegerField(default=0)

    class Meta:
        default_permissions = ()


class AssignmentPollManager(BaseManager):
    """
    Customized model manager to support our get_prefetched_queryset method.
    """

    def get_prefetched_queryset(self, *args, **kwargs):
        """
        Returns the normal queryset with all assignment polls. In the background we
        join and prefetch all related models.
        """
        return (
            super()
            .get_prefetched_queryset(*args, **kwargs)
            .select_related("assignment")
            .prefetch_related(
                "options", "options__user", "options__votes", "voted", "groups"
            )
        )


class AssignmentPoll(RESTModelMixin, BasePoll):
    access_permissions = AssignmentPollAccessPermissions()
    can_see_permission = "assignments.can_see"
    objects = AssignmentPollManager()

    option_class = AssignmentOption

    assignment = models.ForeignKey(
        Assignment, on_delete=CASCADE_AND_AUTOUPDATE, related_name="polls"
    )

    description = models.CharField(max_length=255, blank=True)

    POLLMETHOD_YN = "YN"
    POLLMETHOD_YNA = "YNA"
    POLLMETHOD_Y = "Y"
    POLLMETHOD_N = "N"
    POLLMETHODS = (
        (POLLMETHOD_Y, "Yes per candidate"),
        (POLLMETHOD_N, "No per candidate"),
        (POLLMETHOD_YN, "Yes/No per candidate"),
        (POLLMETHOD_YNA, "Yes/No/Abstain per candidate"),
    )
    pollmethod = models.CharField(max_length=5, choices=POLLMETHODS)

    PERCENT_BASE_Y = "Y"
    PERCENT_BASE_YN = "YN"
    PERCENT_BASE_YNA = "YNA"
    PERCENT_BASE_VALID = "valid"
    PERCENT_BASE_CAST = "cast"
    PERCENT_BASE_DISABLED = "disabled"
    PERCENT_BASES = (
        (PERCENT_BASE_YN, "Yes/No per candidate"),
        (PERCENT_BASE_YNA, "Yes/No/Abstain per candidate"),
        (PERCENT_BASE_Y, "Sum of votes including general No/Abstain"),
        (PERCENT_BASE_VALID, "All valid ballots"),
        (PERCENT_BASE_CAST, "All casted ballots"),
        (PERCENT_BASE_DISABLED, "Disabled (no percents)"),
    )
    onehundred_percent_base = models.CharField(
        max_length=8, blank=False, null=False, choices=PERCENT_BASES
    )

    global_yes = models.BooleanField(default=True)
    db_amount_global_yes = models.DecimalField(
        null=True,
        blank=True,
        default=Decimal("0"),
        validators=[MinValueValidator(Decimal("-2"))],
        max_digits=15,
        decimal_places=6,
    )

    global_no = models.BooleanField(default=True)
    db_amount_global_no = models.DecimalField(
        null=True,
        blank=True,
        default=Decimal("0"),
        validators=[MinValueValidator(Decimal("-2"))],
        max_digits=15,
        decimal_places=6,
    )

    global_abstain = models.BooleanField(default=True)
    db_amount_global_abstain = models.DecimalField(
        null=True,
        blank=True,
        default=Decimal("0"),
        validators=[MinValueValidator(Decimal("-2"))],
        max_digits=15,
        decimal_places=6,
    )

    votes_amount = models.IntegerField(default=1, validators=[MinValueValidator(1)])
    """ For "votes" mode: The amount of votes a voter can give. """

    allow_multiple_votes_per_candidate = models.BooleanField(default=False)

    class Meta:
        default_permissions = ()

    def get_amount_global_yes(self):
        if not self.global_yes:
            return None
        elif self.type == self.TYPE_ANALOG:
            return self.db_amount_global_yes
        elif self.pollmethod in (
            AssignmentPoll.POLLMETHOD_Y,
            AssignmentPoll.POLLMETHOD_N,
        ):
            return sum(option.yes for option in self.options.all())
        else:
            return None

    def set_amount_global_yes(self, value):
        if self.type != self.TYPE_ANALOG:
            raise ValueError("Do not set amount_global_yes for non analog polls")
        self.db_amount_global_yes = value

    amount_global_yes = property(get_amount_global_yes, set_amount_global_yes)

    def get_amount_global_no(self):
        if not self.global_no:
            return None
        elif self.type == self.TYPE_ANALOG:
            return self.db_amount_global_no
        elif self.pollmethod in (
            AssignmentPoll.POLLMETHOD_Y,
            AssignmentPoll.POLLMETHOD_N,
        ):
            return sum(option.no for option in self.options.all())
        else:
            return None

    def set_amount_global_no(self, value):
        if self.type != self.TYPE_ANALOG:
            raise ValueError("Do not set amount_global_no for non analog polls")
        self.db_amount_global_no = value

    amount_global_no = property(get_amount_global_no, set_amount_global_no)

    def get_amount_global_abstain(self):
        if not self.global_abstain:
            return None
        elif self.type == self.TYPE_ANALOG:
            return self.db_amount_global_abstain
        elif self.pollmethod in (
            AssignmentPoll.POLLMETHOD_Y,
            AssignmentPoll.POLLMETHOD_N,
        ):
            return sum(option.abstain for option in self.options.all())
        else:
            return None

    def set_amount_global_abstain(self, value):
        if self.type != self.TYPE_ANALOG:
            raise ValueError("Do not set amount_global_abstain for non analog polls")
        self.db_amount_global_abstain = value

    amount_global_abstain = property(
        get_amount_global_abstain, set_amount_global_abstain
    )

    def create_options(self, skip_autoupdate=False):
        related_users = AssignmentRelatedUser.objects.filter(
            assignment__id=self.assignment.id
        )

        for related_user in related_users:
            option = AssignmentOption(
                user=related_user.user, weight=related_user.weight, poll=self
            )
            option.save(skip_autoupdate=skip_autoupdate)

        # Add all candidates to list of speakers of related agenda item
        if config["assignment_poll_add_candidates_to_list_of_speakers"]:
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
            if not skip_autoupdate:
                inform_changed_data(self.assignment.list_of_speakers)

    def reset(self):
        self.db_amount_global_yes = Decimal(0)
        self.db_amount_global_no = Decimal(0)
        self.db_amount_global_abstain = Decimal(0)
        super().reset()
