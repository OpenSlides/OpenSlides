from typing import Any, Dict

from django.conf import settings
from django.contrib.auth.models import AnonymousUser
from django.contrib.contenttypes.fields import GenericRelation
from django.core.exceptions import ImproperlyConfigured, ValidationError
from django.db import IntegrityError, models, transaction
from django.db.models import Max
from django.utils import formats, timezone
from django.utils.translation import ugettext as _, ugettext_noop
from jsonfield import JSONField

from openslides.agenda.models import Item
from openslides.core.config import config
from openslides.core.models import Projector, Tag
from openslides.mediafiles.models import Mediafile
from openslides.poll.models import (
    BaseOption,
    BasePoll,
    BaseVote,
    CollectDefaultVotesMixin,
)
from openslides.utils.autoupdate import inform_changed_data
from openslides.utils.exceptions import OpenSlidesError
from openslides.utils.models import RESTModelMixin

from .access_permissions import (
    CategoryAccessPermissions,
    MotionAccessPermissions,
    MotionBlockAccessPermissions,
    MotionChangeRecommendationAccessPermissions,
    MotionCommentSectionAccessPermissions,
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
        ordering = ['weight', 'title']

    def __str__(self):
        return self.title


class MotionManager(models.Manager):
    """
    Customized model manager to support our get_full_queryset method.
    """
    def get_full_queryset(self):
        """
        Returns the normal queryset with all motions. In the background we
        join and prefetch all related models.
        """
        return (self.get_queryset()
                .select_related('state')
                .prefetch_related(
                    'state__workflow',
                    'comments',
                    'comments__section',
                    'comments__section__read_groups',
                    'agenda_items',
                    'log_messages',
                    'polls',
                    'attachments',
                    'tags',
                    'submitters',
                    'supporters'))


class Motion(RESTModelMixin, models.Model):
    """
    Model for motions.

    This class is the main entry point to all other classes related to a motion.
    """
    access_permissions = MotionAccessPermissions()
    can_see_permission = 'motions.can_see'

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
        'State',
        related_name='+',
        on_delete=models.PROTECT,  # Do not let the user delete states, that are used for motions
        null=True)  # TODO: Check whether null=True is necessary.
    """
    The related state object.

    This attribute is to get the current state of the motion.
    """

    state_extension = models.TextField(blank=True, null=True)
    """
    A text field fo additional information about the state.
    """

    recommendation = models.ForeignKey(
        'State',
        related_name='+',
        on_delete=models.SET_NULL,
        null=True)
    """
    The recommendation of a person or committee for this motion.
    """

    recommendation_extension = models.TextField(blank=True, null=True)
    """
    A text field fo additional information about the recommendation.
    """

    identifier = models.CharField(max_length=255, null=True, blank=True,
                                  unique=True)
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
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='children')
    """
    A parent field for multi-depth sorting of motions.
    """

    category = models.ForeignKey(
        'Category',
        on_delete=models.SET_NULL,
        null=True,
        blank=True)
    """
    ForeignKey to one category of motions.
    """

    motion_block = models.ForeignKey(
        'MotionBlock',
        on_delete=models.SET_NULL,
        null=True,
        blank=True)
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
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='amendments')
    """
    Field for amendments to reference to the motion that should be altered.

    Null if the motion is not an amendment.
    """

    statute_paragraph = models.ForeignKey(
        StatuteParagraph,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='motions')
    """
    Field to reference to a statute paragraph if this motion is a
    statute-amendment.

    Null if the motion is not a statute-amendment.
    """

    tags = models.ManyToManyField(Tag, blank=True)
    """
    Tags to categorise motions.
    """

    supporters = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='motion_supporters', blank=True)
    """
    Users who support this motion.
    """

    # In theory there could be one then more agenda_item. But we support only
    # one. See the property agenda_item.
    agenda_items = GenericRelation(Item, related_name='motions')

    class Meta:
        default_permissions = ()
        permissions = (
            ('can_see', 'Can see motions'),
            ('can_create', 'Can create motions'),
            ('can_support', 'Can support motions'),
            ('can_manage_metadata', 'Can manage motion metadata'),
            ('can_manage', 'Can manage motions'),
        )
        ordering = ('identifier', )
        verbose_name = ugettext_noop('Motion')

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
                    super(Motion, self).save(skip_autoupdate=True, *args, **kwargs)  # type: ignore
            except IntegrityError:
                # Identifier is already used.
                if hasattr(self, '_identifier_prefix'):
                    # Calculate a new one and try again.
                    self.identifier_number, self.identifier = self.increment_identifier_number(
                        self.identifier_number,
                        self._identifier_prefix,
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

    def delete(self, skip_autoupdate=False, *args, **kwargs):
        """
        Customized method to delete a motion. Ensures that a respective
        motion projector element is disabled.
        """
        Projector.remove_any(
            skip_autoupdate=skip_autoupdate,
            name='motions/motion',
            id=self.pk)
        return super().delete(skip_autoupdate=skip_autoupdate, *args, **kwargs)  # type: ignore

    def set_identifier(self):
        """
        Sets the motion identifier automaticly according to the config value if
        it is not set yet.
        """
        # The identifier is already set or should be set manually.
        if config['motions_identifier'] == 'manually' or self.identifier:
            # Do not set an identifier.
            return

        # If MOTION_IDENTIFIER_WITHOUT_BLANKS is set, don't use blanks when building identifier.
        without_blank = hasattr(settings, 'MOTION_IDENTIFIER_WITHOUT_BLANKS') and settings.MOTION_IDENTIFIER_WITHOUT_BLANKS

        # Build prefix.
        if self.is_amendment():
            parent_identifier = self.parent.identifier or ''
            if without_blank:
                prefix = '%s%s' % (parent_identifier, config['motions_amendments_prefix'])
            else:
                prefix = '%s %s ' % (parent_identifier, config['motions_amendments_prefix'])
        elif self.category is None or not self.category.prefix:
            prefix = ''
        else:
            if without_blank:
                prefix = '%s' % self.category.prefix
            else:
                prefix = '%s ' % self.category.prefix
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
            elif config['motions_identifier'] == 'per_category':
                motions = Motion.objects.filter(category=self.category)
            # The motions should be counted over all.
            else:
                motions = Motion.objects.all()

            number = motions.aggregate(Max('identifier_number'))['identifier_number__max'] or 0
            initial_increment = True

        # Calculate new identifier.
        number, identifier = self.increment_identifier_number(
            number,
            prefix,
            initial_increment=initial_increment)

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
        identifier = '%s%s' % (prefix, self.extend_identifier_number(number))
        while Motion.objects.filter(identifier=identifier).exists():
            number += 1
            identifier = '%s%s' % (prefix, self.extend_identifier_number(number))
        return number, identifier

    def extend_identifier_number(self, number):
        """
        Returns the number used in the set_identifier method with leading
        zero charaters according to the settings value
        MOTION_IDENTIFIER_MIN_DIGITS.
        """
        result = str(number)
        if hasattr(settings, 'MOTION_IDENTIFIER_MIN_DIGITS') and settings.MOTION_IDENTIFIER_MIN_DIGITS:
            if not isinstance(settings.MOTION_IDENTIFIER_MIN_DIGITS, int):
                raise ImproperlyConfigured('Settings value MOTION_IDENTIFIER_MIN_DIGITS must be an integer.')
            result = '0' * (settings.MOTION_IDENTIFIER_MIN_DIGITS - len(str(number))) + result
        return result

    def is_submitter(self, user):
        """
        Returns True if user is a submitter of this motion, else False.
        """
        return self.submitters.filter(user=user).exists()

    def is_supporter(self, user):
        """
        Returns True if user is a supporter of this motion, else False.
        """
        return user in self.supporters.all()

    def create_poll(self, skip_autoupdate=False):
        """
        Create a new poll for this motion.

        Return the new poll object.
        """
        if self.state.allow_create_poll:
            poll = MotionPoll(motion=self)
            poll.save(skip_autoupdate=skip_autoupdate)
            poll.set_options(skip_autoupdate=skip_autoupdate)
            return poll
        else:
            raise WorkflowError('You can not create a poll in state %s.' % self.state.name)

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
        if type(state) is int:
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

        if type(workflow) is int:
            workflow = Workflow.objects.get(pk=workflow)

        if workflow is not None:
            new_state = workflow.first_state
        elif self.state:
            new_state = self.state.workflow.first_state
        else:
            new_state = (Workflow.objects.get(pk=config['motions_workflow']).first_state or
                         Workflow.objects.get(pk=config['motions_workflow']).states.all()[0])
        self.set_state(new_state)

    def set_recommendation(self, recommendation):
        """
        Set the recommendation of the motion.

        'recommendation' can be the id of a state object or a state object.
        """
        if type(recommendation) is int:
            recommendation = State.objects.get(pk=recommendation)
        self.recommendation = recommendation

    def follow_recommendation(self):
        """
        Set the state of this motion to its recommendation.
        """
        if self.recommendation is not None:
            self.set_state(self.recommendation)

    """
    Container for runtime information for agenda app (on create or update of this instance).
    """
    agenda_item_update_information: Dict[str, Any] = {}

    def get_agenda_title(self):
        """
        Return the title string for the agenda.

        If the identifier is given, the title consists of the motion verbose name
        and the identifier.
        Note: It has to be the same return value like in JavaScript.
        """
        if self.identifier:
            title = '%s %s' % (_(self._meta.verbose_name), self.identifier)
        else:
            title = self.title
        return title

    def get_agenda_title_with_type(self):
        """
        Return a title for the agenda with the type or the modified title if the
        identifier is set..

        Note: It has to be the same return value like in JavaScript.
        """
        if self.identifier:
            title = '%s %s' % (_(self._meta.verbose_name), self.identifier)
        else:
            title = '%s (%s)' % (self.title, _(self._meta.verbose_name))
        return title

    @property
    def agenda_item(self):
        """
        Returns the related agenda item.
        """
        # We support only one agenda item so just return the first element of
        # the queryset.
        return self.agenda_items.all()[0]

    @property
    def agenda_item_id(self):
        """
        Returns the id of the agenda item object related to this object.
        """
        return self.agenda_item.pk

    def write_log(self, message_list, person=None, skip_autoupdate=False):
        """
        Write a log message.

        The message should be in English and translatable,
        e. g. motion.write_log(message_list=[ugettext_noop('Message Text')])
        """
        if person and not person.is_authenticated:
            person = None
        motion_log = MotionLog(motion=self, message_list=message_list, person=person)
        motion_log.save(skip_autoupdate=skip_autoupdate)

    def is_amendment(self):
        """
        Returns True if the motion is an amendment.

        A motion is a amendment if amendments are activated in the config and
        the motion has a parent.
        """
        return config['motions_amendments_enabled'] and self.parent is not None

    def is_paragraph_based_amendment(self):
        """
        Returns True if the motion is an amendment that stores the changes on a per-paragraph-basis
        and is therefore eligible to be shown in diff-view.
        """
        return self.is_amendment() and self.amendment_paragraphs

    def get_amendments_deep(self):
        """
        Generator that yields all amendments of this motion including all
        amendment decendents.
.       """
        for amendment in self.amendments.all():
            yield amendment
            yield from amendment.get_amendments_deep()

    def get_paragraph_based_amendments(self):
        """
        Returns a list of all paragraph-based amendments to this motion
        """
        return list(filter(lambda amend: amend.is_paragraph_based_amendment(), self.amendments.all()))


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
        settings.AUTH_GROUP_MODEL,
        blank=True,
        related_name='read_comments')
    """
    These groups have read-access to the section.
    """

    write_groups = models.ManyToManyField(
        settings.AUTH_GROUP_MODEL,
        blank=True,
        related_name='write_comments')
    """
    These groups have write-access to the section.
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
        Motion,
        on_delete=models.CASCADE,
        related_name='comments')
    """
    The motion where this comment belongs to.
    """

    section = models.ForeignKey(
        MotionCommentSection,
        on_delete=models.PROTECT,
        related_name='comments')
    """
    The section of the comment.
    """

    class Meta:
        default_permissions = ()
        unique_together = ('motion', 'section')

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
            raise OpenSlidesError(
                _('{user} is already a submitter.').format(user=user))
        if isinstance(user, AnonymousUser):
            raise OpenSlidesError(
                _('An anonymous user can not be a submitter.'))
        weight = (self.filter(motion=motion).aggregate(
            models.Max('weight'))['weight__max'] or 0)
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

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE)
    """
    ForeignKey to the user who is the submitter.
    """

    motion = models.ForeignKey(
        Motion,
        on_delete=models.CASCADE,
        related_name='submitters')
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


class MotionChangeRecommendationManager(models.Manager):
    """
    Customized model manager to support our get_full_queryset method.
    """
    def get_full_queryset(self):
        """
        Returns the normal queryset with all change recommendations. In the background we
        join and prefetch all related models.
        """
        return self.get_queryset()


class MotionChangeRecommendation(RESTModelMixin, models.Model):
    """
    A MotionChangeRecommendation object saves change recommendations for a specific Motion
    """

    access_permissions = MotionChangeRecommendationAccessPermissions()

    objects = MotionChangeRecommendationManager()

    motion = models.ForeignKey(
        Motion,
        on_delete=models.CASCADE,
        related_name='change_recommendations')
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
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True)
    """A user object, who created this change recommendation. Optional."""

    creation_time = models.DateTimeField(auto_now=True)
    """Time when the change recommendation was saved."""

    def collides_with_other_recommendation(self, recommendations):
        for recommendation in recommendations:
            if (not (self.line_from < recommendation.line_from and self.line_to <= recommendation.line_from) and
                    not (self.line_from >= recommendation.line_to and self.line_to > recommendation.line_to)):
                return True

        return False

    def save(self, *args, **kwargs):
        recommendations = (MotionChangeRecommendation.objects
                           .filter(motion=self.motion)
                           .exclude(pk=self.pk))

        if self.collides_with_other_recommendation(recommendations):
            raise ValidationError('The recommendation collides with an existing one (line %s - %s).' %
                                  (self.line_from, self.line_to))

        return super().save(*args, **kwargs)

    class Meta:
        default_permissions = ()

    def __str__(self):
        """Return a string, representing this object."""
        return "Recommendation for Motion %s, line %s - %s" % (self.motion_id, self.line_from, self.line_to)


class Category(RESTModelMixin, models.Model):
    """
    Model for categories of motions.
    """
    access_permissions = CategoryAccessPermissions()

    name = models.CharField(max_length=255)
    """Name of the category."""

    prefix = models.CharField(blank=True, max_length=32)
    """Prefix of the category.

    Used to build the identifier of a motion.
    """

    class Meta:
        default_permissions = ()
        ordering = ['prefix']

    def __str__(self):
        return self.name


class MotionBlockManager(models.Manager):
    """
    Customized model manager to support our get_full_queryset method.
    """
    def get_full_queryset(self):
        """
        Returns the normal queryset with all motion blocks. In the
        background the related agenda item is prefetched from the database.
        """
        return self.get_queryset().prefetch_related('agenda_items')


class MotionBlock(RESTModelMixin, models.Model):
    """
    Model for blocks of motions.
    """
    access_permissions = MotionBlockAccessPermissions()

    objects = MotionBlockManager()

    title = models.CharField(max_length=255)

    # In theory there could be one then more agenda_item. But we support only
    # one. See the property agenda_item.
    agenda_items = GenericRelation(Item, related_name='topics')

    class Meta:
        verbose_name = ugettext_noop('Motion block')
        default_permissions = ()

    def __str__(self):
        return self.title

    def delete(self, skip_autoupdate=False, *args, **kwargs):
        """
        Customized method to delete a motion block. Ensures that a respective
        motion block projector element is disabled.
        """
        Projector.remove_any(
            skip_autoupdate=skip_autoupdate,
            name='motions/motion-block',
            id=self.pk)
        return super().delete(skip_autoupdate=skip_autoupdate, *args, **kwargs)  # type: ignore

    """
    Container for runtime information for agenda app (on create or update of this instance).
    """
    agenda_item_update_information: Dict[str, Any] = {}

    @property
    def agenda_item(self):
        """
        Returns the related agenda item.
        """
        # We support only one agenda item so just return the first element of
        # the queryset.
        return self.agenda_items.all()[0]

    @property
    def agenda_item_id(self):
        """
        Returns the id of the agenda item object related to this object.
        """
        return self.agenda_item.pk

    def get_agenda_title(self):
        return self.title

    def get_agenda_title_with_type(self):
        return '%s (%s)' % (self.get_agenda_title(), _(self._meta.verbose_name))


class MotionLog(RESTModelMixin, models.Model):
    """Save a logmessage for a motion."""

    motion = models.ForeignKey(
        Motion,
        on_delete=models.CASCADE,
        related_name='log_messages')
    """The motion to witch the object belongs."""

    message_list = JSONField()
    """
    The log message. It should be a list of strings in English.
    """

    person = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True)
    """A user object, who created the log message. Optional."""

    time = models.DateTimeField(auto_now=True)
    """The Time, when the loged action was performed."""

    class Meta:
        default_permissions = ()
        ordering = ['-time']

    def __str__(self):
        """
        Return a string, representing the log message.
        """
        localtime = timezone.localtime(self.time)
        time = formats.date_format(localtime, 'DATETIME_FORMAT')
        time_and_messages = '%s ' % time + ''.join(map(_, self.message_list))
        if self.person is not None:
            return _('%(time_and_messages)s by %(person)s') % {'time_and_messages': time_and_messages,
                                                               'person': self.person}
        return time_and_messages

    def get_root_rest_element(self):
        """
        Returns the motion to this instance which is the root REST element.
        """
        return self.motion


class MotionVote(RESTModelMixin, BaseVote):
    """Saves the votes for a MotionPoll.

    There should allways be three MotionVote objects for each poll,
    one for 'yes', 'no', and 'abstain'."""

    option = models.ForeignKey(
        'MotionOption',
        on_delete=models.CASCADE)
    """The option object, to witch the vote belongs."""

    class Meta:
        default_permissions = ()

    def get_root_rest_element(self):
        """
        Returns the motion to this instance which is the root REST element.
        """
        return self.option.poll.motion


class MotionOption(RESTModelMixin, BaseOption):
    """Links between the MotionPollClass and the MotionVoteClass.

    There should be one MotionOption object for each poll."""

    poll = models.ForeignKey(
        'MotionPoll',
        on_delete=models.CASCADE)
    """The poll object, to witch the object belongs."""

    vote_class = MotionVote
    """The VoteClass, to witch this Class links."""

    class Meta:
        default_permissions = ()

    def get_root_rest_element(self):
        """
        Returns the motion to this instance which is the root REST element.
        """
        return self.poll.motion


# TODO: remove the type-ignoring in the next line, after this is solved:
#       https://github.com/python/mypy/issues/3855
class MotionPoll(RESTModelMixin, CollectDefaultVotesMixin, BasePoll):  # type: ignore
    """The Class to saves the vote result for a motion poll."""

    motion = models.ForeignKey(
        Motion,
        on_delete=models.CASCADE,
        related_name='polls')
    """The motion to witch the object belongs."""

    option_class = MotionOption
    """The option class, witch links between this object the the votes."""

    vote_values = ['Yes', 'No', 'Abstain']
    """The possible anwers for the poll. 'Yes, 'No' and 'Abstain'."""

    class Meta:
        default_permissions = ()

    def __str__(self):
        """
        Representation method only for debugging purposes.
        """
        return 'MotionPoll for motion %s' % self.motion

    def set_options(self, skip_autoupdate=False):
        """Create the option class for this poll."""
        # TODO: maybe it is possible with .create() to call this without poll=self
        #       or call this in save()
        self.get_option_class()(poll=self).save(skip_autoupdate=skip_autoupdate)

    def get_percent_base_choice(self):
        return config['motions_poll_100_percent_base']

    def get_slide_context(self, **context):
        return super(MotionPoll, self).get_slide_context(poll=self)

    def get_root_rest_element(self):
        """
        Returns the motion to this instance which is the root REST element.
        """
        return self.motion


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

    name = models.CharField(max_length=255)
    """A string representing the state."""

    recommendation_label = models.CharField(max_length=255, null=True)
    """A string for a recommendation to set the motion to this state."""

    workflow = models.ForeignKey(
        'Workflow',
        on_delete=models.CASCADE,
        related_name='states')
    """A many-to-one relation to a workflow."""

    next_states = models.ManyToManyField('self', symmetrical=False, blank=True)
    """A many-to-many relation to all states, that can be choosen from this state."""

    css_class = models.CharField(max_length=255, default='primary')
    """
    A css class string for showing the state name in a coloured label based on bootstrap,
    e.g. 'danger' (red), 'success' (green), 'warning' (yellow), 'default' (grey).
    Default value is 'primary' (blue).
    """

    required_permission_to_see = models.CharField(max_length=255, blank=True)
    """
    A permission string. If not empty, the user has to have this permission to
    see a motion in this state.

    To use this feature change the database entry of a state object and add
    your favourite permission string. You can do this e. g. by editing the
    definitions in create_builtin_workflows() in openslides/motions/signals.py.
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
        if self.recommendation_label == '':
            raise WorkflowError('The field recommendation_label of {} must not '
                                'be an empty string.'.format(self))
        super(State, self).save(**kwargs)

    def check_next_states(self):
        """Checks whether all next states of a state belong to the correct workflow."""
        # No check if it is a new state which has not been saved yet.
        if not self.id:
            return
        for state in self.next_states.all():
            if not state.workflow == self.workflow:
                raise WorkflowError('%s can not be next state of %s because it does not belong to the same workflow.' % (state, self))

    def get_root_rest_element(self):
        """
        Returns the workflow to this instance which is the root REST element.
        """
        return self.workflow


class WorkflowManager(models.Manager):
    """
    Customized model manager to support our get_full_queryset method.
    """
    def get_full_queryset(self):
        """
        Returns the normal queryset with all workflows. In the background
        the first state is joined and all states and next states are
        prefetched from the database.
        """
        return (self.get_queryset()
                .select_related('first_state')
                .prefetch_related('states', 'states__next_states'))


class Workflow(RESTModelMixin, models.Model):
    """
    Defines a workflow for a motion.
    """
    access_permissions = WorkflowAccessPermissions()

    objects = WorkflowManager()

    name = models.CharField(max_length=255)
    """A string representing the workflow."""

    first_state = models.OneToOneField(
        State,
        on_delete=models.SET_NULL,
        related_name='+',
        null=True,
        blank=True)
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
                '%s can not be first state of %s because it '
                'does not belong to it.' % (self.first_state, self))
