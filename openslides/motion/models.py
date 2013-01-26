#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.motion.models
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Models for the motion app.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
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


# TODO: Save submitter and supporter in the same table
class MotionSubmitter(models.Model):
    person = PersonField()
    motion = models.ForeignKey('Motion', related_name="submitter")

    def __unicode__(self):
        return unicode(self.person)


class MotionSupporter(models.Model):
    person = PersonField()
    motion = models.ForeignKey('Motion', related_name="supporter")

    def __unicode__(self):
        return unicode(self.person)


class Motion(SlideMixin, models.Model):
    """
    The Motion-Model.
    """
    prefix = "motion"  # Rename this in the slide-system

    # TODO: Use this attribute for the default_version, if the permission system
    #       is deactivated. Maybe it has to be renamed.
    permitted_version = models.ForeignKey(
        'MotionVersion', null=True, blank=True, related_name="permitted")
    # TODO: Define status
    status = models.CharField(max_length=3)
    # Log (Translatable)
    identifier = models.CharField(max_length=255, null=True, blank=True,
                                  unique=True)
    category = models.ForeignKey('Category', null=True, blank=True)
    # TODO proposal
    # Maybe rename to master_copy
    master = models.ForeignKey('self', null=True, blank=True)

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
        return self.get_title()

    # TODO: Use transaction
    def save(self, *args, **kwargs):
        """
        Saves the motion. Create or update a motion_version object
        """
        super(Motion, self).save(*args, **kwargs)
        for attr in ['title', 'text', 'reason']:
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
            # TODO: choose an explicit version
            version = self.last_version
        else:
            # We do not need to save the motion version
            return
        for attr in ['title', 'text', 'reason']:
            _attr = '_%s' % attr
            try:
                setattr(version, attr, getattr(self, _attr))
            except AttributeError:
                setattr(version, attr, getattr(self.last_version, attr))
        version.save()

    def get_absolute_url(self, link='detail'):
        if link == 'view' or link == 'detail':
            return reverse('motion_detail', args=[str(self.id)])
        if link == 'edit':
            return reverse('motion_edit', args=[str(self.id)])
        if link == 'delete':
            return reverse('motion_delete', args=[str(self.id)])

    def get_title(self):
        """
        Get the title of the motion. The titel is taken from motion.version
        """
        try:
            return self._title
        except AttributeError:
            return self.version.title

    def set_title(self, title):
        """
        Set the titel of the motion. The titel will me saved in motion.save()
        """
        self._title = title

    title = property(get_title, set_title)

    def get_text(self):
        """
        Get the text of the motion. Simular to get_title()
        """
        try:
            return self._text
        except AttributeError:
            return self.version.text

    def set_text(self, text):
        """
        Set the text of the motion. Simular to set_title()
        """
        self._text = text

    text = property(get_text, set_text)

    def get_reason(self):
        """
        Get the reason of the motion. Simular to get_title()
        """
        try:
            return self._reason
        except AttributeError:
            return self.version.reason

    def set_reason(self, reason):
        """
        Set the reason of the motion. Simular to set_title()
        """
        self._reason = reason

    reason = property(get_reason, set_reason)

    @property
    def new_version(self):
        """
        On the first call, it creates a new version. On any later call, it
        use the existing new version.

        The new_version object will be deleted when it is saved into the db
        """
        try:
            return self._new_version
        except AttributeError:
            self._new_version = MotionVersion(motion=self)
            return self._new_version

    def get_version(self, version_id):
        """
        Return a specific version from version_id
        """
        # TODO: Check case, if version_id is not one of this motion
        return self.versions.get(pk=version_id)


    def get_version(self):
        """
        Get the "active" version object. This version will be used to get the
        data for this motion.
        """
        try:
            return self._version
        except AttributeError:
            # TODO: choose right version via config
            return self.last_version

    def set_version(self, version):
        """
        Set the "active" version object.

        If version is None, the last_version will be used.
        If version is a version object, this object will be used.
        If version is Int, the N version of this motion will be used.
        """
        if version is None:
            try:
                del self._version
            except AttributeError:
                pass
        else:
            if type(version) is int:
                version = self.versions.all()[version]
            elif type(version) is not MotionVersion:
                raise ValueError('The argument \'version\' has to be int or '
                                 'MotionVersion, not %s' % type(version))
            # TODO: Test, that the version is one of this motion
            self._version = version

    version = property(get_version, set_version)

    @property
    def last_version(self):
        """
        Get the newest version of the motion
        """
        # TODO: Fix the case, that the motion has no Version
        try:
            return self.versions.order_by('id').reverse()[0]
        except IndexError:
            return self.new_version

    def is_supporter(self, person):
        try:
            return self.supporter.filter(person=person).exists()
        except AttributeError:
            return False

    def support(self, person):
        """
        Add a Supporter to the list of supporters of the motion.
        """
        if not self.is_supporter(person):
            MotionSupporter(motion=self, person=person).save()
            #self.writelog(_("Supporter: +%s") % (person))
        # TODO: Raise a precise exception for the view in else-clause

    def unsupport(self, person):
        """
        remove a supporter from the list of supporters of the motion
        """
        try:
            self.supporter.filter(person=person).delete()
        except MotionSupporter.DoesNotExist:
            # TODO: Don't do nothing but raise a precise exception for the view
            pass
        #else:
            #self.writelog(_("Supporter: -%s") % (person))


class MotionVersion(models.Model):
    title = models.CharField(max_length=255, verbose_name=ugettext_lazy("Title"))
    text = models.TextField(verbose_name=_("Text"))
    reason = models.TextField(null=True, blank=True, verbose_name=ugettext_lazy("Reason"))
    rejected = models.BooleanField(default=False)
    creation_time = models.DateTimeField(auto_now=True)
    motion = models.ForeignKey(Motion, related_name='versions')
    identifier = models.CharField(max_length=255, verbose_name=ugettext_lazy("Version identifier"))
    note = models.TextField(null=True, blank=True)

    def __unicode__(self):
        return "%s Version %s" % (self.motion, self.version_number)

    def get_absolute_url(self, link='detail'):
        if link == 'view' or link == 'detail':
            return reverse('motion_version_detail', args=[str(self.motion.id),
                                                          str(self.version_number)])

    @property
    def version_number(self):
        if self.pk is None:
            return 'new'
        return (MotionVersion.objects.filter(motion=self.motion)
                                     .filter(id__lte=self.pk).count())


class Category(models.Model):
    name = models.CharField(max_length=255, verbose_name=ugettext_lazy("Category name"))
    prefix = models.CharField(max_length=32, verbose_name=ugettext_lazy("Category prefix"))

    def __unicode__(self):
        return self.name


class Comment(models.Model):
    motion_version = models.ForeignKey(MotionVersion)
    text = models.TextField()
    author = PersonField()
    creation_time = models.DateTimeField(auto_now=True)
