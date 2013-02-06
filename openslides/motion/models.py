#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.motion.models
    ~~~~~~~~~~~~~~~~~~~~~~~~

    Models for the motion app.

    To use a motion object, you only have to import the Motion class. Any
    functionality can be reached from a motion object.

    :copyright: (c) 2011-2013 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from datetime import datetime

from django.core.urlresolvers import reverse
from django.db import models
from django.db.models import Max
from django.dispatch import receiver
from django.utils.translation import pgettext
from django.utils.translation import ugettext_lazy, ugettext_noop, ugettext as _

from openslides.utils.utils import _propper_unicode
from openslides.utils.person import PersonField
from openslides.config.models import config
from openslides.config.signals import default_config_value
from openslides.poll.models import (
    BaseOption, BasePoll, CountVotesCast, CountInvalid, BaseVote)
from openslides.participant.models import User
from openslides.projector.api import register_slidemodel
from openslides.projector.models import SlideMixin
from openslides.agenda.models import Item

from .workflow import (motion_workflow_choices, get_state, State, WorkflowError,
                       DUMMY_STATE)


class Motion(SlideMixin, models.Model):
    """The Motion Class.

    This class is the main entry point to all other classes related to a motion.
    """

    prefix = "motion"
    """Prefix for the slide system."""

    active_version = models.ForeignKey('MotionVersion', null=True,
                                       related_name="active_version")
    """Points to a specific version.

    Used be the permitted-version-system to deside witch version is the active
    Version. Could also be used to only choose a specific version as a default
    version. Like the Sighted versions on Wikipedia.
    """

    state_id = models.CharField(max_length=3)
    """The id of a state object.

    This Attribute is used be motion.state to identify the current state of the
    motion.
    """

    identifier = models.CharField(max_length=255, null=True, blank=True,
                                  unique=True)
    """A string as human readable identifier for the motion."""

    # category = models.ForeignKey('Category', null=True, blank=True)
    # TODO: proposal
    #master = models.ForeignKey('self', null=True, blank=True)

    class Meta:
        permissions = (
            ('can_see_motion', ugettext_noop('Can see motions')),
            ('can_create_motion', ugettext_noop('Can create motions')),
            ('can_support_motion', ugettext_noop('Can support motions')),
            ('can_manage_motion', ugettext_noop('Can manage motions')),
        )
        # TODO: order per default by category and identifier
        # ordering = ('number',)

    def __unicode__(self):
        """Return a human readable name of this motion."""
        return self.get_title()

    # TODO: Use transaction
    def save(self, *args, **kwargs):
        """Save the motion.

        1. Set the state of a new motion to the default motion.
        2. Save the motion object.
        3. Save the version Data.
        4. Set the active version for the motion.

        A new version will be saved if motion.new_version was called
        between the creation of this object and the last call of motion.save()

            or

        If the motion has new version data (title, text, reason)

            and

        the config 'motion_create_new_version' is set to
        'ALLWASY_CREATE_NEW_VERSION'.
        """
        if not self.state_id:
            self.reset_state()

        super(Motion, self).save(*args, **kwargs)

        # Find out if the version data has changed
        for attr in ['title', 'text', 'reason']:
            if not self.versions.exists():
                new_data = True
                break
            if getattr(self, attr) != getattr(self.last_version, attr):
                new_data = True
                break
        else:
            new_data = False

        need_new_version = config['motion_create_new_version'] == 'ALLWASY_CREATE_NEW_VERSION'
        if hasattr(self, '_new_version') or (new_data and need_new_version):
            version = self.new_version
            del self._new_version
            version.motion = self  # Test if this line is realy neccessary.
        elif new_data and not need_new_version:
            version = self.last_version
        else:
            # We do not need to save the motion version.
            return

        # Save title, text and reason in the version object
        for attr in ['title', 'text', 'reason']:
            _attr = '_%s' % attr
            try:
                setattr(version, attr, getattr(self, _attr))
                delattr(self, _attr)
            except AttributeError:
                if self.versions.exists():
                    # If the _attr was not set, use the value from last_version
                    setattr(version, attr, getattr(self.last_version, attr))

        # Set version_number of the new Version (if neccessary) and save it into the DB
        if version.id is None:
            # TODO: auto increment the version_number in the Database
            version_number = self.versions.aggregate(Max('version_number'))['version_number__max'] or 0
            version.version_number = version_number + 1
        version.save()

        # Set the active Version of this motion. This has to be done after the
        # version is saved to the db
        if not self.state.version_permission or self.active_version is None:
            self.active_version = version
            self.save()

    def get_absolute_url(self, link='detail'):
        """Return an URL for this version.

        The keywordargument 'link' can be 'detail', 'view', 'edit' or 'delete'.
        """
        if link == 'view' or link == 'detail':
            return reverse('motion_detail', args=[str(self.id)])
        if link == 'edit':
            return reverse('motion_edit', args=[str(self.id)])
        if link == 'delete':
            return reverse('motion_delete', args=[str(self.id)])

    def get_title(self):
        """Get the title of the motion.

        The titel is taken from motion.version.
        """
        try:
            return self._title
        except AttributeError:
            return self.version.title

    def set_title(self, title):
        """Set the titel of the motion.

        The titel will me saved into the version object, wenn motion.save() is
        called.
        """
        self._title = title

    title = property(get_title, set_title)
    """The title of the motion.

    Is saved in a MotionVersion object.
    """

    def get_text(self):
        """Get the text of the motion.

        Simular to get_title().
        """
        try:
            return self._text
        except AttributeError:
            return self.version.text

    def set_text(self, text):
        """ Set the text of the motion.

        Simular to set_title().
        """
        self._text = text

    text = property(get_text, set_text)
    """The text of a motin.

    Is saved in a MotionVersion object.
    """

    def get_reason(self):
        """Get the reason of the motion.

        Simular to get_title().
        """
        try:
            return self._reason
        except AttributeError:
            return self.version.reason

    def set_reason(self, reason):
        """Set the reason of the motion.

        Simular to set_title().
        """
        self._reason = reason

    reason = property(get_reason, set_reason)
    """The reason for the motion.

    Is saved in a MotionVersion object.
    """

    @property
    def new_version(self):
        """Return a Version object, not saved in the database.

        On the first call, it creates a new version. On any later call, it
        use the existing new version.

        The new_version object will be deleted when it is saved into the db.
        """
        try:
            return self._new_version
        except AttributeError:
            self._new_version = MotionVersion(motion=self)
            return self._new_version

    def get_version(self):
        """Get the 'active' version object.

        This version will be used to get the data for this motion.
        """
        try:
            return self._version
        except AttributeError:
            return self.last_version

    def set_version(self, version):
        """Set the 'active' version object.

        The keyargument 'version' can be a MotionVersion object or the
        version_number of a VersionObject or None.

        If the argument is None, the newest version will be used.
        """
        if version is None:
            try:
                del self._version
            except AttributeError:
                pass
        else:
            if type(version) is int:
                version = self.versions.get(version_number=version)
            elif type(version) is not MotionVersion:
                raise ValueError('The argument \'version\' has to be int or '
                                 'MotionVersion, not %s' % type(version))
            # TODO: Test, that the version is one of this motion
            self._version = version

    version = property(get_version, set_version)
    """The active version of this motion."""

    @property
    def last_version(self):
        """Return the newest version of the motion."""
        # TODO: Fix the case, that the motion has no Version
        try:
            return self.versions.order_by('-version_number')[0]
        except IndexError:
            return self.new_version

    def is_submitter(self, person):
        """Return True, if person is a submitter of this motion. Else: False."""
        self.submitter.filter(person=person).exists()

    def is_supporter(self, person):
        """Return True, if person is a supporter of this motion. Else: False."""
        return self.supporter.filter(person=person).exists()

    def support(self, person):
        """Add 'person' as a supporter of this motion."""
        if self.state.support:
            if not self.is_supporter(person):
                MotionSupporter(motion=self, person=person).save()
        else:
            raise WorkflowError("You can not support a motion in state %s" % self.state.name)

    def unsupport(self, person):
        """Remove 'person' as supporter from this motion."""
        if self.state.support:
            self.supporter.filter(person=person).delete()
        else:
            raise WorkflowError("You can not unsupport a motion in state %s" % self.state.name)

    def create_poll(self):
        """Create a new poll for this motion.

        Return the new poll object.
        """
        if self.state.create_poll:
            # TODO: auto increment the poll_number in the Database
            poll_number = self.polls.aggregate(Max('poll_number'))['poll_number__max'] or 0
            poll = MotionPoll.objects.create(motion=self, poll_number=poll_number + 1)
            poll.set_options()
            return poll
        else:
            raise WorkflowError("You can not create a poll in state %s" % self.state.name)

    def get_state(self):
        """Return the state of the motion.

        State is a State object. See openslides.motion.workflow for more informations.
        """
        try:
            return get_state(self.state_id)
        except WorkflowError:
            return DUMMY_STATE

    def set_state(self, next_state):
        """Set the state of this motion.

        The keyargument 'next_state' has to be a State object or an id of a
        State object.
        """
        if not isinstance(next_state, State):
            next_state = get_state(next_state)
        if next_state in self.state.next_states:
            self.state_id = next_state.id
        else:
            raise WorkflowError('%s is not a valid next_state' % next_state)

    state = property(get_state, set_state)
    """The state of the motion as Ste object."""

    def reset_state(self):
        """Set the state to the default state."""
        self.state_id = get_state('default').id

    def slide(self):
        """Return the slide dict."""
        data = super(Motion, self).slide()
        data['motion'] = self
        data['title'] = self.title
        data['template'] = 'projector/Motion.html'
        return data

    def get_agenda_title(self):
        """Return a title for the Agenda."""
        return self.last_version.title

    ## def get_agenda_title_supplement(self):
        ## number = self.number or '<i>[%s]</i>' % ugettext('no number')
        ## return '(%s %s)' % (ugettext('motion'), number)

    def get_allowed_actions(self, person):
        """Return a dictonary with all allowed actions for a specific person.

        The dictonary contains the following actions.

        * edit
        * delete
        * create_poll
        * support
        * unsupport
        * change_state
        * reset_state
        """
        actions = {
            'edit': ((self.is_submitter(person) and
                      self.state.edit_as_submitter) or
                     person.has_perm('motion.can_manage_motion')),

            'create_poll': (person.has_perm('motion.can_manage_motion') and
                            self.state.create_poll),

            'support': (self.state.support and
                        config['motion_min_supporters'] > 0 and
                        not self.is_submitter(person)),

            'change_state': person.has_perm('motion.can_manage_motion'),

        }
        actions['delete'] = actions['edit']  # TODO: Only if the motion has no number
        actions['unsupport'] = actions['support']
        actions['reset_state'] = 'change_state'
        return actions

    def write_log(self, message, person=None):
        """Write a log message.

        Message should be in english and translatable.

        e.G: motion.write_log(ugettext_noob('Message Text'))
        """
        MotionLog.objects.create(motion=self, message=message, person=person)

    def activate_version(self, version):
        """Set the active state of a version to True.

        'version' can be a version object, or the version_number of a version.
        """
        if type(version) is int:
            version = self.versions.get(version_number=version)
        self.active_version = version

        if version.rejected:
            version.rejected = False
            version.save()

    def reject_version(self, version):
        """Reject a version of this motion.

        'version' can be a version object, or the version_number of a version.
        """
        if type(version) is int:
            version = self.versions.get(version_number=version)

        if version.active:
            raise MotionError('The active version can not be rejected')

        version.rejected = True
        version.save()


class MotionVersion(models.Model):
    """
    A MotionVersion object saves some date of the motion."""

    motion = models.ForeignKey(Motion, related_name='versions')
    """The Motion, to witch the version belongs."""

    version_number = models.PositiveIntegerField(default=1)
    """An id for this version in realation to a motion.

    Is unique for each motion.
    """

    title = models.CharField(max_length=255, verbose_name=ugettext_lazy("Title"))
    """The Title of a motion."""

    text = models.TextField(verbose_name=_("Text"))
    """The text of a motion."""

    reason = models.TextField(null=True, blank=True, verbose_name=ugettext_lazy("Reason"))
    """The reason for a motion."""

    rejected = models.BooleanField(default=False)
    """Saves, if the version is rejected."""

    creation_time = models.DateTimeField(auto_now=True)
    """Time, when the version was saved."""

    #identifier = models.CharField(max_length=255, verbose_name=ugettext_lazy("Version identifier"))
    #note = models.TextField(null=True, blank=True)

    class Meta:
        unique_together = ("motion", "version_number")

    def __unicode__(self):
        """Return a string, representing this object."""
        counter = self.version_number or _('new')
        return "%s Version %s" % (self.motion, counter)

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


## class Category(models.Model):
    ## name = models.CharField(max_length=255, verbose_name=ugettext_lazy("Category name"))
    ## prefix = models.CharField(max_length=32, verbose_name=ugettext_lazy("Category prefix"))

    ## def __unicode__(self):
        ## return self.name


## class Comment(models.Model):
    ## motion_version = models.ForeignKey(MotionVersion)
    ## text = models.TextField()
    ## author = PersonField()
    ## creation_time = models.DateTimeField(auto_now=True)


class MotionLog(models.Model):
    """Save a logmessage for a motion."""

    motion = models.ForeignKey(Motion, related_name='log_messages')
    """The motion to witch the object belongs."""

    message = models.CharField(max_length=255)
    """The log message.

    Should be in english.
    """

    person = PersonField(null=True)
    """A person object, who created the log message. Optional."""

    time = models.DateTimeField(auto_now=True)
    """The Time, when the loged action was performed."""

    class Meta:
        ordering = ['-time']

    def __unicode__(self):
        """Return a string, representing the log message."""
        # TODO: write time in the local time format.
        if self.person is None:
            return "%s %s" % (self.time, _(self.message))
        else:
            return "%s %s by %s" % (self.time, _(self.message), self.person)


class MotionError(Exception):
    """Exception raised when errors in the motion accure."""
    pass


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
        return _('Ballot %d') % self.poll_number

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
