from django.conf import settings
from django.contrib.auth.models import AnonymousUser
from django.db import IntegrityError, models, transaction
from django.db.models import Max
from jsonfield import JSONField

from openslides.agenda.mixins import AgendaItemWithListOfSpeakersMixin
from openslides.core.config import config
from openslides.core.models import Tag
from openslides.mediafiles.models import Mediafile
from openslides.poll.models import BaseOption, BasePoll, BaseVote
from openslides.utils.autoupdate import inform_changed_data
from openslides.utils.exceptions import OpenSlidesError
from openslides.utils.manager import BaseManager
from openslides.utils.models import RESTModelMixin
from openslides.utils.rest_api import ValidationError

from ..utils.models import CASCADE_AND_AUTOUPDATE, SET_NULL_AND_AUTOUPDATE
from .access_permissions import (
    CategoryAccessPermissions,
    MotionAccessPermissions,
    MotionBlockAccessPermissions,
    MotionChangeRecommendationAccessPermissions,
    MotionCommentSectionAccessPermissions,
    MotionOptionAccessPermissions,
    MotionPollAccessPermissions,
    MotionVoteAccessPermissions,
    StateAccessPermissions,
    StatuteParagraphAccessPermissions,
    WorkflowAccessPermissions,
)
from .exceptions import WorkflowError


class StatuteParagraph(RESTModelMixin, models.Model):
    """
    Model for parts of the statute
    """

    access_permissions = StatuteParagraphAccessPermissions()

    title = models.CharField(max_length=255)
    """Title of the statute paragraph."""

    text = models.TextField()
    """Content of the statute paragraph."""

    weight = models.IntegerField(default=10000)
    """
    A weight field to sort statute paragraphs.
    """

    class Meta:
        default_permissions = ()
        ordering = ["weight", "title"]

    def __str__(self):
        return self.title


class MotionManager(BaseManager):
    """
    Customized model manager to support our get_prefetched_queryset method.
    """

    def get_prefetched_queryset(self, *args, **kwargs):
        """
        Returns the normal queryset with all motions. In the background we
        join and prefetch all related models.
        """
        return (
            super()
            .get_prefetched_queryset(*args, **kwargs)
            .select_related("state")
            .prefetch_related(
                "state__workflow",
                "comments",
                "comments__section",
                "comments__section__read_groups",
                "agenda_items",
                "lists_of_speakers",
                "attachments",
                "tags",
                "submitters",
                "supporters",
                "change_recommendations",
                "amendments",
            )
        )


class Motion(RESTModelMixin, AgendaItemWithListOfSpeakersMixin, models.Model):
    """
    Model for motions.

    This class is the main entry point to all other classes related to a motion.
    """

    access_permissions = MotionAccessPermissions()
    can_see_permission = "motions.can_see"

    objects = MotionManager()

    title = models.CharField(max_length=255)
    """The title of a motion."""

    text = models.TextField()
    """The text of a motion."""

    amendment_paragraphs = JSONField(null=True)
    """
    If paragraph-based, diff-enabled amendment style is used, this field stores an array of strings or null values.
    Each entry corresponds to a paragraph of the text of the original motion.
    If the entry is null, then the paragraph remains unchanged.
    If the entry is a string, this is the new text of the paragraph.
    amendment_paragraphs and text are mutually exclusive.
    """

    modified_final_version = models.TextField(null=True, blank=True)
    """A field to copy in the final version of the motion and edit it there."""

    reason = models.TextField(null=True, blank=True)
    """The reason for a motion."""

    state = models.ForeignKey(
        "State",
        related_name="+",
        on_delete=models.PROTECT,  # Do not let the user delete states, that are used for motions
        null=True,
    )  # TODO: Check whether null=True is necessary.
    """
    The related state object.

    This attribute is to get the current state of the motion.
    """

    state_extension = models.TextField(blank=True, null=True)
    """
    A text field fo additional information about the state.
    """

    recommendation = models.ForeignKey(
        "State", related_name="+", on_delete=SET_NULL_AND_AUTOUPDATE, null=True
    )
    """
    The recommendation of a person or committee for this motion.
    """

    recommendation_extension = models.TextField(blank=True, null=True)
    """
    A text field fo additional information about the recommendation.
    """

    identifier = models.CharField(max_length=255, null=True, blank=True, unique=True)
    """
    A string as human readable identifier for the motion.
    """

    identifier_number = models.IntegerField(null=True)
    """
    Counts the number of the motion in one category.

    Needed to find the next free motion identifier.
    """

    weight = models.IntegerField(default=10000)
    """
    A weight field to sort motions.
    """

    sort_parent = models.ForeignKey(
        "self",
        on_delete=SET_NULL_AND_AUTOUPDATE,
        null=True,
        blank=True,
        related_name="children",
    )
    """
    A parent field for multi-depth sorting of motions.
    """

    category = models.ForeignKey(
        "Category", on_delete=SET_NULL_AND_AUTOUPDATE, null=True, blank=True
    )
    """
    ForeignKey to one category of motions.
    """

    category_weight = models.IntegerField(default=10000)
    """
    Sorts the motions inside a category. Default is 10000 so new motions
    in a category will be added on the end of the list.
    """

    motion_block = models.ForeignKey(
        "MotionBlock", on_delete=SET_NULL_AND_AUTOUPDATE, null=True, blank=True
    )
    """
    ForeignKey to one block of motions.
    """

    origin = models.CharField(max_length=255, blank=True)
    """
    A string to describe the origin of this motion e. g. that it was
    discussed at another assembly/conference.
    """

    attachments = models.ManyToManyField(Mediafile, blank=True)
    """
    Many to many relation to mediafile objects.
    """

    parent = models.ForeignKey(
        "self",
        on_delete=SET_NULL_AND_AUTOUPDATE,
        null=True,
        blank=True,
        related_name="amendments",
    )
    """
    Field for amendments to reference to the motion that should be altered.

    Null if the motion is not an amendment.
    """

    statute_paragraph = models.ForeignKey(
        StatuteParagraph,
        on_delete=SET_NULL_AND_AUTOUPDATE,
        null=True,
        blank=True,
        related_name="motions",
    )
    """
    Field to reference to a statute paragraph if this motion is a
    statute-amendment.

    Null if the motion is not a statute-amendment.
    """

    tags = models.ManyToManyField(Tag, blank=True)
    """
    Tags to categorise motions.
    """

    supporters = models.ManyToManyField(
        settings.AUTH_USER_MODEL, related_name="motion_supporters", blank=True
    )
    """
    Users who support this motion.
    """

    created = models.DateTimeField(auto_now_add=True)
    """
    Timestamp when motion is created.
    """

    last_modified = models.DateTimeField(auto_now=True)
    """
    Timestamp when motion is modified.
    """

    class Meta:
        default_permissions = ()
        permissions = (
            ("can_see", "Can see motions"),
            ("can_see_internal", "Can see motions in internal state"),
            ("can_create", "Can create motions"),
            ("can_create_amendments", "Can create amendments"),
            ("can_support", "Can support motions"),
            ("can_manage_metadata", "Can manage motion metadata"),
            ("can_manage", "Can manage motions"),
            ("can_manage_polls", "Can manage motion polls"),
        )
        ordering = ("identifier",)
        verbose_name = "Motion"

    def __str__(self):
        """
        Return the title of this motion.
        """
        return self.title

    # TODO: Use transaction
    def save(self, skip_autoupdate=False, *args, **kwargs):
        """
        Save the motion.

        1. Set the state of a new motion to the default state.
        2. Ensure that the identifier is not an empty string.
        3. Save the motion object.
        """
        if not self.state:
            self.reset_state()

        # Solves the problem, that there can only be one motion with an empty
        # string as identifier.
        if not self.identifier and isinstance(self.identifier, str):
            self.identifier = None

        # Try to save the motion until it succeeds with a correct identifier.
        while True:
            try:
                # Always skip autoupdate. Maybe we run it later in this method.
                with transaction.atomic():
                    super(Motion, self).save(  # type: ignore
                        skip_autoupdate=True, *args, **kwargs
                    )
            except IntegrityError:
                # Identifier is already used.
                if hasattr(self, "_identifier_prefix"):
                    # Calculate a new one and try again.
                    (
                        self.identifier_number,
                        self.identifier,
                    ) = self.increment_identifier_number(
                        self.identifier_number, self._identifier_prefix
                    )
                else:
                    # Do not calculate a new one but reraise the IntegrityError.
                    # The error is caught in the category sort view.
                    raise
            else:
                # Save was successful. End loop.
                break

        if not skip_autoupdate:
            inform_changed_data(self)

    def set_identifier(self):
        """
        Sets the motion identifier automaticly according to the config value if
        it is not set yet.
        """
        # The identifier is already set or should be set manually.
        if config["motions_identifier"] == "manually" or self.identifier:
            # Do not set an identifier.
            return

        # If config 'motions_identifier_with_blank' is set, use blanks when building identifier.
        with_blank = config["motions_identifier_with_blank"]

        # Build prefix.
        if self.is_amendment():
            parent_identifier = self.parent.identifier or ""
            if with_blank:
                prefix = f"{parent_identifier} {config['motions_amendments_prefix']}"
            else:
                prefix = f"{parent_identifier}{config['motions_amendments_prefix']}"
        elif self.category is None or not self.category.prefix:
            prefix = ""
        else:
            if with_blank:
                prefix = f"{self.category.prefix} "
            else:
                prefix = self.category.prefix
        self._identifier_prefix = prefix

        # Use the already assigned identifier_number, if the motion has one.
        # Else get the biggest number.
        if self.identifier_number is not None:
            number = self.identifier_number
            initial_increment = False
        else:
            # Find all motions that should be included in the calculations.
            if self.is_amendment():
                motions = self.parent.amendments.all()
            # The motions should be counted per category.
            elif config["motions_identifier"] == "per_category":
                motions = Motion.objects.filter(category=self.category)
            # The motions should be counted over all.
            else:
                motions = Motion.objects.all()

            number = (
                motions.aggregate(Max("identifier_number"))["identifier_number__max"]
                or 0
            )
            initial_increment = True

        # Calculate new identifier.
        number, identifier = self.increment_identifier_number(
            number, prefix, initial_increment=initial_increment
        )

        # Set identifier and identifier_number.
        self.identifier = identifier
        self.identifier_number = number

    def increment_identifier_number(self, number, prefix, initial_increment=True):
        """
        Helper method. It increments the number until a free identifier
        number is found. Returns new number and identifier.
        """
        if initial_increment:
            number += 1
        identifier = f"{prefix}{Motion.extend_identifier_number(number)}"
        while Motion.objects.filter(identifier=identifier).exists():
            number += 1
            identifier = f"{prefix}{Motion.extend_identifier_number(number)}"
        return number, identifier

    @classmethod
    def extend_identifier_number(cls, number):
        """
        Returns the number used in the set_identifier method with leading
        zero charaters according to the config value.
        """
        return "0" * (config["motions_identifier_min_digits"] - len(str(number))) + str(
            number
        )

    def is_submitter(self, user):
        """
        Returns True if user is a submitter of this motion, else False.
        Anonymous users cannot be submitters.
        """
        if isinstance(user, AnonymousUser):
            return False

        return self.submitters.filter(user=user).exists()

    def is_supporter(self, user):
        """
        Returns True if user is a supporter of this motion, else False.
        """
        return user in self.supporters.all()

    @property
    def workflow_id(self):
        """
        Returns the id of the workflow of the motion.
        """
        return self.state.workflow.pk

    def set_state(self, state):
        """
        Set the state of the motion.

        'state' can be the id of a state object or a state object.
        """
        if isinstance(state, int):
            state = State.objects.get(pk=state)

        if not state.dont_set_identifier:
            self.set_identifier()
        self.state = state

    def reset_state(self, workflow=None):
        """
        Set the state to the default state. If an identifier was set
        automatically, reset the identifier and identifier_number.

        'workflow' can be a workflow, an id of a workflow or None.

        If the motion is new and workflow is None, it chooses the default
        workflow from config.
        """

        if isinstance(workflow, int):
            workflow = Workflow.objects.get(pk=workflow)

        if workflow is not None:
            new_state = workflow.first_state
        elif self.state:
            new_state = self.state.workflow.first_state
        else:
            new_state = (
                Workflow.objects.get(pk=config["motions_workflow"]).first_state
                or Workflow.objects.get(pk=config["motions_workflow"]).states.all()[0]
            )
        self.set_state(new_state)

    def set_recommendation(self, recommendation):
        """
        Set the recommendation of the motion.

        'recommendation' can be the id of a state object or a state object.
        """
        if isinstance(recommendation, int):
            recommendation = State.objects.get(pk=recommendation)
        self.recommendation = recommendation

    def follow_recommendation(self):
        """
        Set the state of this motion to its recommendation.
        """
        if self.recommendation is not None:
            self.set_state(self.recommendation)
            if (
                self.recommendation_extension is not None
                and self.state.show_state_extension_field
                and self.recommendation.show_recommendation_extension_field
            ):
                self.state_extension = self.recommendation_extension

    def get_title_information(self):
        return {"title": self.title, "identifier": self.identifier}

    def is_amendment(self):
        """
        Returns True if the motion is an amendment.

        A motion is a amendment if amendments are activated in the config and
        the motion has a parent.
        """
        return config["motions_amendments_enabled"] and self.parent is not None

    def is_paragraph_based_amendment(self):
        """
        Returns True if the motion is an amendment that stores the changes on a per-paragraph-basis
        and is therefore eligible to be shown in diff-view.
        """
        return self.is_amendment() and self.amendment_paragraphs

    def get_paragraph_based_amendments(self):
        """
        Returns a list of all paragraph-based amendments to this motion
        """
        return list(
            filter(
                lambda amend: amend.is_paragraph_based_amendment(),
                self.amendments.all(),
            )
        )

    @property
    def amendment_level(self):
        """
        Returns the amount of parent motions.
        """
        if self.parent is None:
            return 0
        else:
            return self.parent.amendment_level + 1


class MotionCommentSection(RESTModelMixin, models.Model):
    """
    The model for comment sections for motions. Each comment is related to one section, so
    each motions has the ability to have comments from the same section.
    """

    access_permissions = MotionCommentSectionAccessPermissions()

    name = models.CharField(max_length=255)
    """
    The name of the section.
    """

    read_groups = models.ManyToManyField(
        settings.AUTH_GROUP_MODEL, blank=True, related_name="read_comments"
    )
    """
    These groups have read-access to the section.
    """

    write_groups = models.ManyToManyField(
        settings.AUTH_GROUP_MODEL, blank=True, related_name="write_comments"
    )
    """
    These groups have write-access to the section.
    """

    weight = models.IntegerField(default=10000)
    """
    To sort comment sections.
    """

    class Meta:
        default_permissions = ()


class MotionComment(RESTModelMixin, models.Model):
    """
    Represents a motion comment. A comment is always related to a motion and a comment
    section. The section determinates the title of the category.
    """

    comment = models.TextField()
    """
    The comment.
    """

    motion = models.ForeignKey(
        Motion, on_delete=models.CASCADE, related_name="comments"
    )
    """
    The motion where this comment belongs to.
    """

    section = models.ForeignKey(
        MotionCommentSection, on_delete=models.PROTECT, related_name="comments"
    )
    """
    The section of the comment.
    """

    class Meta:
        default_permissions = ()
        unique_together = ("motion", "section")

    def get_root_rest_element(self):
        """
        Returns the motion to this instance which is the root REST element.
        """
        return self.motion


class SubmitterManager(models.Manager):
    """
    Manager for Submitter model. Provides a customized add method.
    """

    def add(self, user, motion, skip_autoupdate=False):
        """
        Customized manager method to prevent anonymous users to be a
        submitter and that someone is not twice a submitter. Cares also
        for the initial sorting of the submitters.
        """
        if self.filter(user=user, motion=motion).exists():
            raise OpenSlidesError(f"{user} is already a submitter.")
        if isinstance(user, AnonymousUser):
            raise OpenSlidesError("An anonymous user can not be a submitter.")
        weight = (
            self.filter(motion=motion).aggregate(models.Max("weight"))["weight__max"]
            or 0
        )
        submitter = self.model(user=user, motion=motion, weight=weight + 1)
        submitter.save(force_insert=True, skip_autoupdate=skip_autoupdate)
        return submitter


class Submitter(RESTModelMixin, models.Model):
    """
    M2M Model for submitters.
    """

    objects = SubmitterManager()
    """
    Use custom Manager.
    """

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=CASCADE_AND_AUTOUPDATE)
    """
    ForeignKey to the user who is the submitter.
    """

    motion = models.ForeignKey(
        Motion, on_delete=models.CASCADE, related_name="submitters"
    )
    """
    ForeignKey to the motion.
    """

    weight = models.IntegerField(null=True)

    class Meta:
        default_permissions = ()

    def __str__(self):
        return str(self.user)

    def get_root_rest_element(self):
        """
        Returns the motion to this instance which is the root REST element.
        """
        return self.motion


class MotionChangeRecommendation(RESTModelMixin, models.Model):
    """
    A MotionChangeRecommendation object saves change recommendations for a specific Motion
    """

    access_permissions = MotionChangeRecommendationAccessPermissions()

    motion = models.ForeignKey(
        Motion, on_delete=CASCADE_AND_AUTOUPDATE, related_name="change_recommendations"
    )
    """The motion to which the change recommendation belongs."""

    rejected = models.BooleanField(default=False)
    """If true, this change recommendation has been rejected"""

    internal = models.BooleanField(default=False)
    """If true, this change recommendation can not be seen by regular users"""

    type = models.PositiveIntegerField(default=0)
    """Replacement (0), Insertion (1), Deletion (2), Other (3)"""

    other_description = models.TextField(blank=True)
    """The description text for type 'other'"""

    line_from = models.PositiveIntegerField()
    """The number or the first affected line"""

    line_to = models.PositiveIntegerField()
    """The number or the last affected line (inclusive)"""

    text = models.TextField(blank=True)
    """The replacement for the section of the original text specified by motion, line_from and line_to"""

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=SET_NULL_AND_AUTOUPDATE, null=True
    )
    """A user object, who created this change recommendation. Optional."""

    creation_time = models.DateTimeField(auto_now=True)
    """Time when the change recommendation was saved."""

    class Meta:
        default_permissions = ()

    def __str__(self):
        """Return a string, representing this object."""
        return f"Recommendation for Motion {self.motion_id}, line {self.line_from} - {self.line_to}"

    def collides_with_other_recommendation(self, recommendations):
        for recommendation in recommendations:
            if not (
                self.line_from < recommendation.line_from
                and self.line_to <= recommendation.line_from
            ) and not (
                self.line_from >= recommendation.line_to
                and self.line_to > recommendation.line_to
            ):
                return True

        return False

    def save(self, *args, **kwargs):
        recommendations = MotionChangeRecommendation.objects.filter(
            motion=self.motion
        ).exclude(pk=self.pk)

        if self.collides_with_other_recommendation(recommendations):
            raise ValidationError(
                {
                    "detail": "The recommendation collides with an existing one (line {0} - {1}).",
                    "args": [self.line_from, self.line_to],
                }
            )

        result = super().save(*args, **kwargs)

        # Hotfix for #4491: Trigger extra autoupdate for motion so that the serializer
        # field vor motion change recommendations gets updated too.
        inform_changed_data(self.motion)

        return result

    def delete(self, *args, **kwargs):
        # Hotfix for #4491: Trigger extra autoupdate for motion so that the serializer
        # field vor motion change recommendations gets updated too.
        motion = self.motion
        result = super().delete(*args, **kwargs)
        inform_changed_data(motion)
        return result


class Category(RESTModelMixin, models.Model):
    """
    Model for categories of motions.
    """

    access_permissions = CategoryAccessPermissions()

    name = models.CharField(max_length=255)
    """Name of the category."""

    prefix = models.CharField(blank=True, max_length=32)
    """
    Prefix of the category.
    Used to build the identifier of a motion.
    """

    parent = models.ForeignKey(
        "self",
        on_delete=CASCADE_AND_AUTOUPDATE,
        null=True,
        blank=True,
        related_name="children",
    )

    weight = models.IntegerField(default=10000)

    class Meta:
        default_permissions = ()
        ordering = ["weight"]

    def __str__(self):
        if self.prefix:
            return f"{self.prefix} - {self.name}"
        else:
            return self.name

    @property
    def level(self):
        """
        Returns the level in the tree of categories. Level 0 means this
        item is a root item in the tree. Level 1 indicates that the parent is
        a root item, level 2 that the parent's parent is a root item and so on.

        Attention! This executes one query for each ancestor of the category.
        """
        if self.parent is None:
            return 0
        else:
            return self.parent.level + 1


class MotionBlockManager(BaseManager):
    """
    Customized model manager to support our get_prefetched_queryset method.
    """

    def get_prefetched_queryset(self, *args, **kwargs):
        """
        Returns the normal queryset with all motion blocks. In the
        background the related agenda item is prefetched from the database.
        """
        return (
            super()
            .get_prefetched_queryset(*args, **kwargs)
            .prefetch_related("agenda_items", "lists_of_speakers", "motion_set")
        )


class MotionBlock(RESTModelMixin, AgendaItemWithListOfSpeakersMixin, models.Model):
    """
    Model for blocks of motions.
    """

    access_permissions = MotionBlockAccessPermissions()

    objects = MotionBlockManager()

    title = models.CharField(max_length=255)

    internal = models.BooleanField(default=False)
    """
    If a motion block is internal, only users with `motions.can_manage` can see and
    manage these blocks.
    """

    class Meta:
        verbose_name = "Motion block"
        default_permissions = ()

    def __str__(self):
        return self.title

    def get_title_information(self):
        return {"title": self.title}


class MotionVoteManager(BaseManager):
    """
    Customized model manager to support our get_prefetched_queryset method.
    """

    def get_prefetched_queryset(self, *args, **kwargs):
        """
        Returns the normal queryset with all motion votes. In the background we
        join and prefetch all related models.
        """
        return (
            super()
            .get_prefetched_queryset(*args, **kwargs)
            .select_related("user", "option", "option__poll")
        )


class MotionVote(RESTModelMixin, BaseVote):
    access_permissions = MotionVoteAccessPermissions()
    option = models.ForeignKey(
        "MotionOption", on_delete=CASCADE_AND_AUTOUPDATE, related_name="votes"
    )

    objects = MotionVoteManager()

    class Meta:
        default_permissions = ()
        unique_together = ("user", "option")


class MotionOptionManager(BaseManager):
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
            .select_related("poll")
            .prefetch_related("votes")
        )


class MotionOption(RESTModelMixin, BaseOption):
    access_permissions = MotionOptionAccessPermissions()
    can_see_permission = "motions.can_see"
    objects = MotionOptionManager()
    vote_class = MotionVote

    poll = models.ForeignKey(
        "MotionPoll", related_name="options", on_delete=CASCADE_AND_AUTOUPDATE
    )

    class Meta:
        default_permissions = ()


class MotionPollManager(BaseManager):
    """
    Customized model manager to support our get_prefetched_queryset method.
    """

    def get_prefetched_queryset(self, *args, **kwargs):
        """
        Returns the normal queryset with all motion polls. In the background we
        join and prefetch all related models.
        """
        return (
            super()
            .get_prefetched_queryset(*args, **kwargs)
            .select_related("motion")
            .prefetch_related("options", "options__votes", "voted", "groups")
        )


class MotionPoll(RESTModelMixin, BasePoll):
    access_permissions = MotionPollAccessPermissions()
    can_see_permission = "motions.can_see"
    option_class = MotionOption

    objects = MotionPollManager()

    motion = models.ForeignKey(
        Motion, on_delete=CASCADE_AND_AUTOUPDATE, related_name="polls"
    )

    POLLMETHOD_YN = "YN"
    POLLMETHOD_YNA = "YNA"
    POLLMETHODS = (("YN", "YN"), ("YNA", "YNA"))
    pollmethod = models.CharField(max_length=3, choices=POLLMETHODS)

    class Meta:
        default_permissions = ()

    def create_options(self):
        MotionOption.objects.create(poll=self)


class State(RESTModelMixin, models.Model):
    """
    Defines a state for a motion.

    Every state belongs to a workflow. All states of a workflow are linked
    together via 'next_states'. One of these states is the first state, but
    this is saved in the workflow table (one-to-one relation). In every
    state you can configure some handling of a motion. See the following
    fields for more information.

    Additionally every motion can refer to one state as recommendation of
    an person or committee (see config 'motions_recommendations_by'). This
    means that the person or committee recommends to set the motion to this
    state.
    """

    access_permissions = StateAccessPermissions()

    name = models.CharField(max_length=255)
    """A string representing the state."""

    recommendation_label = models.CharField(max_length=255, null=True)
    """A string for a recommendation to set the motion to this state."""

    workflow = models.ForeignKey(
        "Workflow", on_delete=models.CASCADE, related_name="states"
    )
    """A many-to-one relation to a workflow."""

    next_states = models.ManyToManyField("self", symmetrical=False, blank=True)
    """A many-to-many relation to all states, that can be choosen from this state."""

    css_class = models.CharField(max_length=255, default="lightblue")
    """
    A css class string for showing the state name in a coloured label. Currently supported
    values are grey, red, green, lightblue and yellow. The default is lightblue.
    """

    restriction = JSONField(default=list)
    """
    Defines which users may see motions in this state:

    Contains a list of one or more of the following strings:
     * motions.can_see_internal
     * motions.can_manage_metadata
     * motions.can_manage
     * is_submitter

    If the list is empty, everybody with the general permission to see motions
    can see this motion. If the list contains at least one item, the user needs
    the permission (or have the attribute) for at least one of the restrictions.

    Default: Empty list so everybody can see the motion.
    """

    allow_support = models.BooleanField(default=False)
    """If true, persons can support the motion in this state."""

    allow_create_poll = models.BooleanField(default=False)
    """If true, polls can be created in this state."""

    allow_submitter_edit = models.BooleanField(default=False)
    """If true, the submitter can edit the motion in this state."""

    dont_set_identifier = models.BooleanField(default=False)
    """
    Decides if the motion gets an identifier.

    If true, the motion does not get an identifier if the state change to
    this one, else it does.
    """

    show_state_extension_field = models.BooleanField(default=False)
    """
    If true, an additional input field (from motion comment) is visible
    to extend the state name. The full state name is composed of the given
    state name and the entered value of this input field.
    """

    merge_amendment_into_final = models.SmallIntegerField(default=0)
    """
    Relevant for amendments:
     1: Amendments of this status or recommendation will be merged into the
        final version of the motion.
     0: Undefined.
    -1: Amendments of this status or recommendation will not be merged into the
        final version of the motion.

    (Hint: The status field takes precedence. That means, if status is 1 or -1,
    this is the final decision. The recommendation only is considered if the
    status is 0)
    """

    show_recommendation_extension_field = models.BooleanField(default=False)
    """
    If true, an additional input field (from motion comment) is visible
    to extend the recommendation label. The full recommendation string is
    composed of the given recommendation label and the entered value of this input field.
    """

    class Meta:
        default_permissions = ()

    def __str__(self):
        """Returns the name of the state."""
        return self.name

    def save(self, **kwargs):
        """Saves a state in the database.

        Used to check the integrity before saving. Also used to check that
        recommendation_label is not an empty string.
        """
        self.check_next_states()
        if self.recommendation_label == "":
            raise WorkflowError(
                f"The field recommendation_label of {self} must not "
                "be an empty string."
            )
        super(State, self).save(**kwargs)

    def check_next_states(self):
        """Checks whether all next states of a state belong to the correct workflow."""
        # No check if it is a new state which has not been saved yet.
        if not self.id:
            return
        for state in self.next_states.all():
            if not state.workflow == self.workflow:
                raise WorkflowError(
                    f"{state} can not be next state of {self} because it does not belong to the same workflow."
                )

    def is_next_or_previous_state_id(self, state_id):
        """ Returns true, if the given state id is a valid next or previous state """
        next_state_ids = [item.id for item in self.next_states.all()]
        previous_state_ids = [
            item.id for item in State.objects.filter(next_states__in=[self.id])
        ]
        return state_id in next_state_ids or state_id in previous_state_ids


class WorkflowManager(BaseManager):
    """
    Customized model manager to support our get_prefetched_queryset method.
    """

    def get_prefetched_queryset(self, *args, **kwargs):
        """
        Returns the normal queryset with all workflows. In the background
        all states are prefetched from the database.
        """
        return (
            super().get_prefetched_queryset(*args, **kwargs).prefetch_related("states")
        )


class Workflow(RESTModelMixin, models.Model):
    """
    Defines a workflow for a motion.
    """

    access_permissions = WorkflowAccessPermissions()

    objects = WorkflowManager()

    name = models.CharField(max_length=255)
    """A string representing the workflow."""

    first_state = models.OneToOneField(
        State, on_delete=models.CASCADE, related_name="+", null=True
    )
    """A one-to-one relation to a state, the starting point for the workflow."""

    class Meta:
        default_permissions = ()

    def __str__(self):
        """Returns the name of the workflow."""
        return self.name

    def save(self, **kwargs):
        """Saves a workflow in the database.

        Used to check the integrity before saving.
        """
        self.check_first_state()
        super(Workflow, self).save(**kwargs)

    def check_first_state(self):
        """Checks whether the first_state itself belongs to the workflow."""
        if self.first_state and not self.first_state.workflow == self:
            raise WorkflowError(
                f"{self.first_state} can not be first state of {self} because it "
                "does not belong to it."
            )
