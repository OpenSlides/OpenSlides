from django.conf import settings
from django.contrib.contenttypes.fields import GenericRelation
from django.core.exceptions import ImproperlyConfigured
from django.db import models
from django.db.models import Max
from django.utils import formats, timezone
from django.utils.translation import ugettext as _
from django.utils.translation import ugettext_lazy, ugettext_noop
from jsonfield import JSONField

from openslides.agenda.models import Item
from openslides.core.config import config
from openslides.core.models import Tag
from openslides.mediafiles.models import Mediafile
from openslides.poll.models import (
    BaseOption,
    BasePoll,
    BaseVote,
    CollectDefaultVotesMixin,
)
from openslides.utils.autoupdate import inform_changed_data
from openslides.utils.models import RESTModelMixin

from .access_permissions import (
    CategoryAccessPermissions,
    MotionAccessPermissions,
    MotionBlockAccessPermissions,
    MotionChangeRecommendationAccessPermissions,
    WorkflowAccessPermissions,
)
from .exceptions import WorkflowError


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
                .select_related('active_version', 'state')
                .prefetch_related(
                    'versions',
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

    objects = MotionManager()

    active_version = models.ForeignKey(
        'MotionVersion',
        on_delete=models.SET_NULL,
        null=True,
        related_name="active_version")
    """
    Points to a specific version.

    Used be the permitted-version-system to deside which version is the active
    version. Could also be used to only choose a specific version as a default
    version. Like the sighted versions on Wikipedia.
    """

    state = models.ForeignKey(
        'State',
        related_name='+',
        on_delete=models.SET_NULL,
        null=True)  # TODO: Check whether null=True is necessary.
    """
    The related state object.

    This attribute is to get the current state of the motion.
    """

    recommendation = models.ForeignKey(
        'State',
        related_name='+',
        on_delete=models.SET_NULL,
        null=True)
    """
    The recommendation of a person or committee for this motion.
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

    tags = models.ManyToManyField(Tag, blank=True)
    """
    Tags to categorise motions.
    """

    submitters = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='motion_submitters', blank=True)
    """
    Users who submit this motion.
    """

    supporters = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='motion_supporters', blank=True)
    """
    Users who support this motion.
    """

    comments = JSONField(null=True)
    """
    Configurable fields for comments. Contains a list of strings.
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
            ('can_see_and_manage_comments', 'Can see and manage comments'),
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
    def save(self, use_version=None, skip_autoupdate=False, *args, **kwargs):
        """
        Save the motion.

        1. Set the state of a new motion to the default state.
        2. Ensure that the identifier is not an empty string.
        3. Save the motion object.
        4. Save the version data.
        5. Set the active version for the motion if a new version object was saved.

        The version data is *not* saved, if
            1. the django-feature 'update_fields' is used or
            2. the argument use_version is False (differ to None).

        The argument use_version is choose the version object into which the
        version data is saved.
            * If use_version is False, no version data is saved.
            * If use_version is None, the last version is used.
            * Else the given version is used.

        To create and use a new version object, you have to set it via the
        use_version argument. You have to set the title, text and reason into
        this version object before giving it to this save method. The properties
        motion.title, motion.text and motion.reason will be ignored.
        """
        if not self.state:
            self.reset_state()

        # Solves the problem, that there can only be one motion with an empty
        # string as identifier.
        if not self.identifier and isinstance(self.identifier, str):
            self.identifier = None

        # Always skip autoupdate. Maybe we run it later in this method.
        super(Motion, self).save(skip_autoupdate=True, *args, **kwargs)

        if 'update_fields' in kwargs:
            # Do not save the version data if only some motion fields are updated.
            if not skip_autoupdate:
                inform_changed_data(self)
            return

        if use_version is False:
            # We do not need to save the version.
            if not skip_autoupdate:
                inform_changed_data(self)
            return
        elif use_version is None:
            use_version = self.get_last_version()
            # Save title, text and reason into the version object.
            for attr in ['title', 'text', 'reason']:
                _attr = '_%s' % attr
                data = getattr(self, _attr, None)
                if data is not None:
                    setattr(use_version, attr, data)
                    delattr(self, _attr)

        # If version is not in the database, test if it has new data and set
        # the version_number.
        if use_version.id is None:
            if not self.version_data_changed(use_version):
                # We do not need to save the version.
                if not skip_autoupdate:
                    inform_changed_data(self)
                return
            version_number = self.versions.aggregate(Max('version_number'))['version_number__max'] or 0
            use_version.version_number = version_number + 1

        # Necessary line if the version was set before the motion got an id.
        use_version.motion = use_version.motion

        # Always skip autoupdate. Maybe we run it later in this method.
        use_version.save(skip_autoupdate=True)

        # Set the active version of this motion. This has to be done after the
        # version is saved in the database.
        # TODO: Move parts of these last lines of code outside the save method
        # when other versions than the last one should be edited later on.
        if self.active_version is None or not self.state.leave_old_version_active:
            # TODO: Don't call this if it was not a new version
            self.active_version = use_version
            # Always skip autoupdate. Maybe we run it later in this method.
            self.save(update_fields=['active_version'], skip_autoupdate=True)

        # Finally run autoupdate if it is not skipped by caller.
        if not skip_autoupdate:
            inform_changed_data(self)

    def version_data_changed(self, version):
        """
        Compare the version with the last version of the motion.

        Returns True if the version data (title, text, reason) is different,
        else returns False.
        """
        if not self.versions.exists():
            # If there is no version in the database, the data has always changed.
            return True

        last_version = self.get_last_version()
        for attr in ['title', 'text', 'reason']:
            if getattr(last_version, attr) != getattr(version, attr):
                return True
        return False

    def set_identifier(self):
        """
        Sets the motion identifier automaticly according to the config value if
        it is not set yet.
        """
        # The identifier is already set or should be set manually.
        if config['motions_identifier'] == 'manually' or self.identifier:
            # Do not set an identifier.
            return

        # The motion is an amendment.
        elif self.is_amendment():
            motions = self.parent.amendments.all()

        # The motions should be counted per category.
        elif config['motions_identifier'] == 'per_category':
            motions = Motion.objects.filter(category=self.category)

        # The motions should be counted over all.
        else:
            motions = Motion.objects.all()

        # Get biggest number.
        number = motions.aggregate(Max('identifier_number'))['identifier_number__max'] or 0

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

        # Calculate new identifier.
        number += 1
        identifier = '%s%s' % (prefix, self.extend_identifier_number(number))
        while Motion.objects.filter(identifier=identifier).exists():
            number += 1
            identifier = '%s%s' % (prefix, self.extend_identifier_number(number))

        # Set identifier and identifier_number.
        self.identifier = identifier
        self.identifier_number = number

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

    def get_title(self):
        """
        Get the title of the motion.

        The title is taken from motion.version.
        """
        try:
            return self._title
        except AttributeError:
            return self.get_active_version().title

    def set_title(self, title):
        """
        Set the title of the motion.

        The title will be saved in the version object, when motion.save() is
        called.
        """
        self._title = title

    title = property(get_title, set_title)
    """
    The title of the motion.

    Is saved in a MotionVersion object.
    """

    def get_text(self):
        """
        Get the text of the motion.

        Simular to get_title().
        """
        try:
            return self._text
        except AttributeError:
            return self.get_active_version().text

    def set_text(self, text):
        """
        Set the text of the motion.

        Simular to set_title().
        """
        self._text = text

    text = property(get_text, set_text)
    """
    The text of a motin.

    Is saved in a MotionVersion object.
    """

    def get_reason(self):
        """
        Get the reason of the motion.

        Simular to get_title().
        """
        try:
            return self._reason
        except AttributeError:
            return self.get_active_version().reason

    def set_reason(self, reason):
        """
        Set the reason of the motion.

        Simular to set_title().
        """
        self._reason = reason

    reason = property(get_reason, set_reason)
    """
    The reason for the motion.

    Is saved in a MotionVersion object.
    """

    def get_new_version(self, **kwargs):
        """
        Return a version object, not saved in the database.

        The version data of the new version object is populated with the data
        set via motion.title, motion.text, motion.reason if these data are
        not given as keyword arguments. If the data is not set in the motion
        attributes, it is populated with the data from the last version
        object if such object exists.
        """
        if self.pk is None:
            # Do not reference the MotionVersion object to an unsaved motion
            new_version = MotionVersion(**kwargs)
        else:
            new_version = MotionVersion(motion=self, **kwargs)
        if self.versions.exists():
            last_version = self.get_last_version()
        else:
            last_version = None
        for attr in ['title', 'text', 'reason']:
            if attr in kwargs:
                continue
            _attr = '_%s' % attr
            data = getattr(self, _attr, None)
            if data is None and last_version is not None:
                data = getattr(last_version, attr)
            if data is not None:
                setattr(new_version, attr, data)
        return new_version

    def get_active_version(self):
        """
        Returns the active version of the motion.

        If no active version is set by now, the last_version is used.
        """
        if self.active_version:
            return self.active_version
        else:
            return self.get_last_version()

    def get_last_version(self):
        """
        Return the newest version of the motion.
        """
        try:
            return self.versions.order_by('-version_number')[0]
        except IndexError:
            return self.get_new_version()

    def is_submitter(self, user):
        """
        Returns True if user is a submitter of this motion, else False.
        """
        return user in self.submitters.all()

    def is_supporter(self, user):
        """
        Returns True if user is a supporter of this motion, else False.
        """
        return user in self.supporters.all()

    def create_poll(self):
        """
        Create a new poll for this motion.

        Return the new poll object.
        """
        if self.state.allow_create_poll:
            poll = MotionPoll.objects.create(motion=self)
            poll.set_options()
            return poll
        else:
            raise WorkflowError('You can not create a poll in state %s.' % self.state.name)

    @property
    def workflow(self):
        """
        Returns the id of the workflow of the motion.
        """
        # TODO: Rename to workflow_id
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
        Set the state to the default state.

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

    def get_agenda_title(self):
        """
        Return a simple title string for the agenda.

        Returns only the motion title so that you have only agenda item number
        and title in the agenda.
        """
        return str(self)

    def get_agenda_list_view_title(self):
        """
        Return a title string for the agenda list view.

        Returns only the motion title so that you have agenda item number,
        title and motion identifier in the agenda.
        Note: It has to be the same return value like in JavaScript.
        """
        if self.identifier:
            string = '%s (%s %s)' % (self.title, _(self._meta.verbose_name), self.identifier)
        else:
            string = '%s (%s)' % (self.title, _(self._meta.verbose_name))
        return string

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
        if person and not person.is_authenticated():
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

    def get_amendments_deep(self):
        """
        Generator that yields all amendments of this motion including all
        amendment decendents.
.       """
        for amendment in self.amendments.all():
            yield amendment
            yield from amendment.get_amendments_deep()


class MotionVersion(RESTModelMixin, models.Model):
    """
    A MotionVersion object saves some date of the motion.
    """

    motion = models.ForeignKey(
        Motion,
        on_delete=models.CASCADE,
        related_name='versions')
    """The motion to which the version belongs."""

    version_number = models.PositiveIntegerField(default=1)
    """An id for this version in realation to a motion.

    Is unique for each motion.
    """

    title = models.CharField(max_length=255)
    """The title of a motion."""

    text = models.TextField()
    """The text of a motion."""

    reason = models.TextField(null=True, blank=True)
    """The reason for a motion."""

    creation_time = models.DateTimeField(auto_now=True)
    """Time when the version was saved."""

    class Meta:
        default_permissions = ()
        unique_together = ("motion", "version_number")

    def __str__(self):
        """Return a string, representing this object."""
        counter = self.version_number or ugettext_lazy('new')
        return "Motion %s, Version %s" % (self.motion_id, counter)

    @property
    def active(self):
        """Return True, if the version is the active version of a motion. Else: False."""
        return self.active_version.exists()

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
    A MotionChangeRecommendation object saves change recommendations for a specific MotionVersion
    """

    access_permissions = MotionChangeRecommendationAccessPermissions()

    objects = MotionChangeRecommendationManager()

    motion_version = models.ForeignKey(
        MotionVersion,
        on_delete=models.CASCADE,
        related_name='change_recommendations')
    """The motion version to which the change recommendation belongs."""

    rejected = models.BooleanField(default=False)
    """If true, this change recommendation has been rejected"""

    type = models.PositiveIntegerField(default=0)
    """Replacement (0), Insertion (1), Deletion (2)"""

    line_from = models.PositiveIntegerField()
    """The number or the first affected line"""

    line_to = models.PositiveIntegerField()
    """The number or the last affected line (inclusive)"""

    text = models.TextField(blank=True)
    """The replacement for the section of the original text specified by version, line_from and line_to"""

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True)
    """A user object, who created this change recommendation. Optional."""

    creation_time = models.DateTimeField(auto_now=True)
    """Time when the change recommendation was saved."""

    class Meta:
        default_permissions = ()

    def __str__(self):
        """Return a string, representing this object."""
        return "Recommendation for Version %s, line %s - %s" % (self.motion_version_id, self.line_from, self.line_to)


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
        default_permissions = ()

    def __str__(self):
        return self.title

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

    def get_agenda_list_view_title(self):
        return self.title


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


class MotionPoll(RESTModelMixin, CollectDefaultVotesMixin, BasePoll):
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

    def set_options(self):
        """Create the option class for this poll."""
        # TODO: maybe it is possible with .create() to call this without poll=self
        #       or call this in save()
        self.get_option_class()(poll=self).save()

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

    action_word = models.CharField(max_length=255)
    """An alternative string to be used for a button to switch to this state."""

    recommendation_label = models.CharField(max_length=255, null=True)
    """A string for a recommendation to set the motion to this state."""

    workflow = models.ForeignKey(
        'Workflow',
        on_delete=models.CASCADE,
        related_name='states')
    """A many-to-one relation to a workflow."""

    next_states = models.ManyToManyField('self', symmetrical=False)
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

    versioning = models.BooleanField(default=False)
    """
    If true, editing the motion will create a new version by default.
    This behavior can be changed by the form and view, e. g. via the
    MotionDisableVersioningMixin.
    """

    leave_old_version_active = models.BooleanField(default=False)
    """If true, new versions are not automaticly set active."""

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

    def get_action_word(self):
        """Returns the alternative name of the state if it exists."""
        return self.action_word or self.name

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
        null=True)
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
