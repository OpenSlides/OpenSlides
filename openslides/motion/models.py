#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.motion.models
    ~~~~~~~~~~~~~~~~~~~~~~~~

    Models for the motion app.

    To use a motion object, you only have to import the Motion class. Any
    functionality can be reached from a motion object.

    :copyright: (c) 2011–2013 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from datetime import datetime

from django.core.urlresolvers import reverse
from django.db import models, IntegrityError
from django.db.models import Max
from django.dispatch import receiver
from django.utils import formats
from django.utils.translation import pgettext
from django.utils.translation import ugettext as _, ugettext_lazy, ugettext_noop

from openslides.utils.jsonfield import JSONField
from openslides.utils.person import PersonField
from openslides.config.api import config
from openslides.poll.models import (
    BaseOption, BasePoll, CountVotesCast, CountInvalid, BaseVote)
from openslides.participant.models import User
from openslides.projector.api import register_slidemodel
from openslides.projector.models import SlideMixin
from openslides.agenda.models import Item

from .exceptions import MotionError, WorkflowError


class Motion(SlideMixin, models.Model):
    """
    The Motion Class.

    This class is the main entry point to all other classes related to a motion.
    """

    prefix = ugettext_noop('motion')
    """
    Prefix for the slide system.
    """

    active_version = models.ForeignKey('MotionVersion', null=True,
                                       related_name="active_version")
    """
    Points to a specific version.

    Used be the permitted-version-system to deside which version is the active
    version. Could also be used to only choose a specific version as a default
    version. Like the sighted versions on Wikipedia.
    """

    state = models.ForeignKey('State', null=True)  # TODO: Check whether null=True is necessary.
    """
    The related state object.

    This attribute is to get the current state of the motion.
    """

    identifier = models.CharField(max_length=255, null=True, blank=True,
                                  unique=True)
    """
    A string as human readable identifier for the motion.
    """

    identifier_number = models.IntegerField(null=True)
    """
    Counts the number of the motion in one category.

    Needed to find the next free motion-identifier.
    """

    category = models.ForeignKey('Category', null=True, blank=True)
    """
    ForeignKey to one category of motions.
    """

    # TODO: proposal
    #master = models.ForeignKey('self', null=True, blank=True)

    class Meta:
        permissions = (
            ('can_see_motion', ugettext_noop('Can see motions')),
            ('can_create_motion', ugettext_noop('Can create motions')),
            ('can_support_motion', ugettext_noop('Can support motions')),
            ('can_manage_motion', ugettext_noop('Can manage motions')),
        )
        ordering = ('identifier', )

    def __unicode__(self):
        """
        Return a human readable name of this motion.
        """
        return self.active_version.title

    # TODO: Use transaction
    def save(self, use_version=None, *args, **kwargs):
        """
        Save the motion.

        1. Set the state of a new motion to the default state.
        2. Ensure that the identifier is not an empty string.
        3. Save the motion object.
        4. Save the version data
        5. Set the active version for the motion, if a new version object was saved.

        The version data is *not* saved, if
            1. The django-feature 'update_fields' is used or
            2. The argument use_version is False (differ to None).

        The version object into which the data is saved is picked in this order:
            1. The argument use_version.
            2. The attribute use_version. As default, use_version is the
               active_version. If the active_version is not set, it is the
               last_version. If the last_version is not set, it is a
               new_version. See use_version property.

        use_version is the version object, in which the version data is saved.
        * If use_version is False, no version data ist saved.
        * If use_version is None, the last version is used.

        To use a new version object, you have to set it via use_version. You have
        to set the title, text and reason into this version object. motion.title
        etc will be ignored.
        """
        if not self.state:
            self.reset_state()

        # Solves the problem, that there can only be one motion with an empty
        # string as identifier
        if self.identifier is '':
            self.identifier = None

        super(Motion, self).save(*args, **kwargs)

        if 'update_fields' in kwargs:
            # Do not save the version-data, if only some motion fields are updated
            return

        if use_version is False:
            # We do not need to save the version
            return
        elif use_version is None:
            use_version = self.get_last_version()

            # Save title, text and reason in the version object.
            for attr in ['title', 'text', 'reason']:
                _attr = '_%s' % attr
                data = getattr(self, _attr, None)
                if data is not None:
                    setattr(use_version, attr, data)
                    delattr(self, _attr)

        # If version is not in the database, test if it has new data and set
        # the version_number
        if use_version.id is None:
            if not self.version_data_changed(use_version):
                # We do not need to save the version
                return
            version_number = self.versions.aggregate(Max('version_number'))['version_number__max'] or 0
            use_version.version_number = version_number + 1

        # Necessary line, if the version was set before the motion had an id.
        # propably a django bug.
        use_version.motion = use_version.motion

        use_version.save()

        # Set the active version of this motion. This has to be done after the
        # version is saved to the database
        if self.active_version is None or not self.state.leave_old_version_active:
            self.active_version = use_version
            self.save(update_fields=['active_version'])

    def get_absolute_url(self, link='detail'):
        """
        Return an URL for this version.

        The keyword argument 'link' can be 'detail', 'view', 'edit',
        'update' or 'delete'.
        """
        if link == 'view' or link == 'detail':
            return reverse('motion_detail', args=[str(self.id)])
        if link == 'update' or link == 'edit':
            return reverse('motion_edit', args=[str(self.id)])
        if link == 'delete':
            return reverse('motion_delete', args=[str(self.id)])

    def version_data_changed(self, version):
        """
        Compare the version with the last version of the motion.

        Returns True if the version data (title, text, reason) is different.
        Else, returns False.
        """
        if not self.versions.exists():
            # if there is no version in the database, the data has always changed
            return True

        last_version = self.get_last_version()
        for attr in ['title', 'text', 'reason']:
            if getattr(last_version, attr) != getattr(version, attr):
                return True
        return False

    def set_identifier(self):
        """
        Sets the motion identifier automaticly according to the config
        value, if it is not set yet.
        """
        if config['motion_identifier'] == 'manually' or self.identifier:
            # Do not set an identifier.
            return
        elif config['motion_identifier'] == 'per_category':
            motions = Motion.objects.filter(category=self.category)
        else:  # That means: config['motion_identifier'] == 'serially_numbered'
            motions = Motion.objects.all()

        number = motions.aggregate(Max('identifier_number'))['identifier_number__max'] or 0
        if self.category is None or not self.category.prefix:
            prefix = ''
        else:
            prefix = '%s ' % self.category.prefix

        number += 1
        identifier = '%s%d' % (prefix, number)
        while Motion.objects.filter(identifier=identifier).exists():
            number += 1
            identifier = '%s%d' % (prefix, number)

        self.identifier = identifier
        self.identifier_number = number

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
        Set the titel of the motion.

        The title will be saved into the version object, wenn motion.save() is
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

    def get_new_version(self):
        """
        Return a version object, not saved in the database.

        The version data of the new version object is populated with the data
        set via motion.title, motion.text, motion.reason. If the data is not set,
        it is population with the data from the last version object.
        """
        new_version = MotionVersion(motion=self)
        if self.versions.exists():
            last_version = self.get_last_version()
        else:
            last_version = None
        for attr in ['title', 'text', 'reason']:
            _attr = '_%s' % attr
            data = getattr(self, _attr, None)
            if data is None and not last_version is None:
                data = getattr(last_version, attr)
            if data is not None:
                setattr(new_version, attr, data)
        return new_version

    def get_active_version(self):
        """
        Returns the active version of the motion.

        If no active version is set by now, the last_version is used
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

    @property
    def submitters(self):
        return sorted([object.person for object in self.submitter.all()],
                      key=lambda person: person.sort_name)

    def is_submitter(self, person):
        """Return True, if person is a submitter of this motion. Else: False."""
        return self.submitter.filter(person=person).exists()

    @property
    def supporters(self):
        return sorted([object.person for object in self.supporter.all()],
                      key=lambda person: person.sort_name)

    def add_submitter(self, person):
        MotionSubmitter.objects.create(motion=self, person=person)

    def clear_submitters(self):
        MotionSubmitter.objects.filter(motion=self).delete()

    def is_supporter(self, person):
        """
        Return True, if person is a supporter of this motion. Else: False.
        """
        return self.supporter.filter(person=person).exists()

    def support(self, person):
        """
        Add 'person' as a supporter of this motion.
        """
        if self.state.allow_support:
            if not self.is_supporter(person):
                MotionSupporter(motion=self, person=person).save()
        else:
            raise WorkflowError('You can not support a motion in state %s.' % self.state.name)

    def unsupport(self, person):
        """
        Remove 'person' as supporter from this motion.
        """
        if self.state.allow_support:
            self.supporter.filter(person=person).delete()
        else:
            raise WorkflowError('You can not unsupport a motion in state %s.' % self.state.name)

    def clear_supporters(self):
        """
        Deletes all supporters of this motion.
        """
        MotionSupporter.objects.filter(motion=self).delete()

    def create_poll(self):
        """
        Create a new poll for this motion.

        Return the new poll object.
        """
        if self.state.allow_create_poll:
            # TODO: auto increment the poll_number in the database
            poll_number = self.polls.aggregate(Max('poll_number'))['poll_number__max'] or 0
            poll = MotionPoll.objects.create(motion=self, poll_number=poll_number + 1)
            poll.set_options()
            return poll
        else:
            raise WorkflowError('You can not create a poll in state %s.' % self.state.name)

    def set_state(self, state):
        """
        Set the state of the motion.

        State can be the id of a state object or a state object.
        """
        if type(state) is int:
            state = State.objects.get(pk=state)

        if not state.dont_set_identifier:
            self.set_identifier()
        self.state = state

    def reset_state(self, workflow=None):
        """
        Set the state to the default state.

        If the motion is new and workflow is None, it chooses the default
        workflow from config.
        """
        if workflow:
            new_state = workflow.first_state
        elif self.state:
            new_state = self.state.workflow.first_state
        else:
            new_state = (Workflow.objects.get(pk=config['motion_workflow']).first_state or
                         Workflow.objects.get(pk=config['motion_workflow']).state_set.all()[0])
        self.set_state(new_state)

    def slide(self):
        """
        Return the slide dict.
        """
        data = super(Motion, self).slide()
        data['motion'] = self
        data['title'] = self.title
        data['template'] = 'projector/Motion.html'
        return data

    def get_agenda_title(self):
        """
        Return a title for the Agenda.
        """
        return self.title

    def get_agenda_title_supplement(self):
        """
        Returns the supplement to the title for the agenda item.
        """
        if self.identifier:
            return '(%s %s)' % (_('Motion'), self.identifier)
        return '(%s)' % _('Motion')

    def get_allowed_actions(self, person):
        """
        Return a dictonary with all allowed actions for a specific person.

        The dictonary contains the following actions.

        * update / edit
        * delete
        * create_poll
        * support
        * unsupport
        * change_state
        * reset_state
        """
        actions = {
            'update': ((self.is_submitter(person) and
                       self.state.allow_submitter_edit) or
                       person.has_perm('motion.can_manage_motion')),

            'delete': person.has_perm('motion.can_manage_motion'),

            'create_poll': (person.has_perm('motion.can_manage_motion') and
                            self.state.allow_create_poll),

            'support': (self.state.allow_support and
                        config['motion_min_supporters'] > 0 and
                        not self.is_submitter(person) and
                        not self.is_supporter(person)),

            'unsupport': (self.state.allow_support and
                          self.is_supporter(person)),

            'change_state': person.has_perm('motion.can_manage_motion'),

            'reset_state': person.has_perm('motion.can_manage_motion')}

        actions['edit'] = actions['update']

        return actions

    def write_log(self, message_list, person=None):
        """
        Write a log message.

        The message should be in English and translatable,
        e. g. motion.write_log(message_list=[ugettext_noop('Message Text')])
        """
        MotionLog.objects.create(motion=self, message_list=message_list, person=person)


class MotionVersion(models.Model):
    """
    A MotionVersion object saves some date of the motion.
    """

    motion = models.ForeignKey(Motion, related_name='versions')
    """The motion to which the version belongs."""

    version_number = models.PositiveIntegerField(default=1)
    """An id for this version in realation to a motion.

    Is unique for each motion.
    """

    title = models.CharField(max_length=255, verbose_name=ugettext_lazy("Title"))
    """The title of a motion."""

    text = models.TextField(verbose_name=ugettext_lazy("Text"))
    """The text of a motion."""

    reason = models.TextField(null=True, blank=True, verbose_name=ugettext_lazy("Reason"))
    """The reason for a motion."""

    creation_time = models.DateTimeField(auto_now=True)
    """Time when the version was saved."""

    #identifier = models.CharField(max_length=255, verbose_name=ugettext_lazy("Version identifier"))
    #note = models.TextField(null=True, blank=True)

    class Meta:
        unique_together = ("motion", "version_number")

    def __unicode__(self):
        """Return a string, representing this object."""
        counter = self.version_number or ugettext_lazy('new')
        return "%s Version %s" % (self.motion, counter)  # TODO: Should this really be self.motion or the title of the specific version?

    def get_absolute_url(self, link='detail'):
        """Return the URL of this Version.

        The keyargument link can be 'view' or 'detail'.
        """
        if link == 'view' or link == 'detail':
            return reverse('motion_version_detail', args=[str(self.motion.id),
                                                          str(self.version_number)])

    @property
    def active(self):
        """Return True, if the version is the active version of a motion. Else: False."""
        return self.active_version.exists()


class MotionSubmitter(models.Model):
    """Save the submitter of a Motion."""

    motion = models.ForeignKey('Motion', related_name="submitter")
    """The motion to witch the object belongs."""

    person = PersonField()
    """The person, who is the submitter."""

    def __unicode__(self):
        """Return the name of the submitter as string."""
        return unicode(self.person)


class MotionSupporter(models.Model):
    """Save the submitter of a Motion."""

    motion = models.ForeignKey('Motion', related_name="supporter")
    """The motion to witch the object belongs."""

    person = PersonField()
    """The person, who is the supporter."""

    def __unicode__(self):
        """Return the name of the supporter as string."""
        return unicode(self.person)


class Category(models.Model):
    name = models.CharField(max_length=255, verbose_name=ugettext_lazy("Category name"))
    """Name of the category."""

    prefix = models.CharField(blank=True, max_length=32, verbose_name=ugettext_lazy("Prefix"))
    """Prefix of the category.

    Used to build the identifier of a motion.
    """

    def __unicode__(self):
        return self.name

    def get_absolute_url(self, link='update'):
        if link == 'update' or link == 'edit':
            return reverse('motion_category_update', args=[str(self.id)])
        if link == 'delete':
            return reverse('motion_category_delete', args=[str(self.id)])

    class Meta:
        ordering = ['prefix']

## class Comment(models.Model):
    ## motion_version = models.ForeignKey(MotionVersion)
    ## text = models.TextField()
    ## author = PersonField()
    ## creation_time = models.DateTimeField(auto_now=True)


class MotionLog(models.Model):
    """Save a logmessage for a motion."""

    motion = models.ForeignKey(Motion, related_name='log_messages')
    """The motion to witch the object belongs."""

    message_list = JSONField()
    """
    The log message. It should be a list of strings in english.
    """

    person = PersonField(null=True)
    """A person object, who created the log message. Optional."""

    time = models.DateTimeField(auto_now=True)
    """The Time, when the loged action was performed."""

    class Meta:
        ordering = ['-time']

    def __unicode__(self):
        """
        Return a string, representing the log message.
        """
        time = formats.date_format(self.time, 'DATETIME_FORMAT')
        return_message = '%s ' % time + ''.join(map(_, self.message_list))
        if self.person is not None:
            return_message += _(' by %s') % self.person
        return return_message


class MotionVote(BaseVote):
    """Saves the votes for a MotionPoll.

    There should allways be three MotionVote objects for each poll,
    one for 'yes', 'no', and 'abstain'."""

    option = models.ForeignKey('MotionOption')
    """The option object, to witch the vote belongs."""


class MotionOption(BaseOption):
    """Links between the MotionPollClass and the MotionVoteClass.

    There should be one MotionOption object for each poll."""

    poll = models.ForeignKey('MotionPoll')
    """The poll object, to witch the object belongs."""

    vote_class = MotionVote
    """The VoteClass, to witch this Class links."""


class MotionPoll(CountInvalid, CountVotesCast, BasePoll):
    """The Class to saves the poll results for a motion poll."""

    motion = models.ForeignKey(Motion, related_name='polls')
    """The motion to witch the object belongs."""

    option_class = MotionOption
    """The option class, witch links between this object the the votes."""

    vote_values = [
        ugettext_noop('Yes'), ugettext_noop('No'), ugettext_noop('Abstain')]
    """The possible anwers for the poll. 'Yes, 'No' and 'Abstain'."""

    poll_number = models.PositiveIntegerField(default=1)
    """An id for this poll in realation to a motion.

    Is unique for each motion.
    """

    class Meta:
        unique_together = ("motion", "poll_number")

    def __unicode__(self):
        """Return a string, representing the poll."""
        return _('Vote %d') % self.poll_number

    def get_absolute_url(self, link='edit'):
        """Return an URL for the poll.

        The keyargument 'link' can be 'edit' or 'delete'.
        """
        if link == 'edit':
            return reverse('motion_poll_edit', args=[str(self.motion.pk),
                                                     str(self.poll_number)])
        if link == 'delete':
            return reverse('motion_poll_delete', args=[str(self.motion.pk),
                                                       str(self.poll_number)])

    def set_options(self):
        """Create the option class for this poll."""
        #TODO: maybe it is possible with .create() to call this without poll=self
        #      or call this in save()
        self.get_option_class()(poll=self).save()

    def append_pollform_fields(self, fields):
        """Apend the fields for invalid and votecast to the ModelForm."""
        CountInvalid.append_pollform_fields(self, fields)
        CountVotesCast.append_pollform_fields(self, fields)


class State(models.Model):
    """Defines a state for a motion.

    Every state belongs to a workflow. All states of a workflow are linked together
    via 'next_states'. One of these states is the first state, but this
    is saved in the workflow table (one-to-one relation). In every state
    you can configure some handling of a motion. See the following fields
    for more information.
    """

    name = models.CharField(max_length=255)
    """A string representing the state."""

    action_word = models.CharField(max_length=255)
    """An alternative string to be used for a button to switch to this state."""

    workflow = models.ForeignKey('Workflow')
    """A many-to-one relation to a workflow."""

    next_states = models.ManyToManyField('self', symmetrical=False)
    """A many-to-many relation to all states, that can be choosen from this state."""

    icon = models.CharField(max_length=255)
    """A string representing the url to the icon-image."""

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
    """Decides if the motion gets an identifier.

    If true, the motion does not get an identifier if the state change to
    this one, else it does."""

    def __unicode__(self):
        """Returns the name of the state."""
        return self.name

    def save(self, **kwargs):
        """Saves a state to the database.

        Used to check the integrity before saving.
        """
        self.check_next_states()
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


class Workflow(models.Model):
    """Defines a workflow for a motion."""

    name = models.CharField(max_length=255)
    """A string representing the workflow."""

    first_state = models.OneToOneField(State, related_name='+', null=True)
    """A one-to-one relation to a state, the starting point for the workflow."""

    def __unicode__(self):
        """Returns the name of the workflow."""
        return self.name

    def save(self, **kwargs):
        """Saves a workflow to the database.

        Used to check the integrity before saving.
        """
        self.check_first_state()
        super(Workflow, self).save(**kwargs)

    def check_first_state(self):
        """Checks whether the first_state itself belongs to the workflow."""
        if self.first_state and not self.first_state.workflow == self:
            raise WorkflowError('%s can not be first state of %s because it does not belong to it.' % (self.first_state, self))
