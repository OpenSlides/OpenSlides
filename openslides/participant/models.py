#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.participant.models
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Models for the participant app.

    :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.contrib.auth.models import User as DjangoUser, Group as DjangoGroup, Permission
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.db.models import signals
from django.dispatch import receiver
from django.utils.translation import ugettext_lazy, ugettext_noop

from openslides.utils.person import PersonMixin, Person
from openslides.utils.person.signals import receive_persons
from openslides.config.api import config
from openslides.projector.api import register_slidemodel
from openslides.projector.projector import SlideMixin


class User(PersonMixin, Person, SlideMixin, DjangoUser):
    prefix = 'user'  # This is for the slides
    person_prefix = 'user'
    GENDER_CHOICES = (
        ('male', ugettext_lazy('Male')),
        ('female', ugettext_lazy('Female')),
    )

    django_user = models.OneToOneField(DjangoUser, editable=False, parent_link=True)
    structure_level = models.CharField(
        max_length=255, blank=True, default='', verbose_name=ugettext_lazy("Structure level"),
        help_text=ugettext_lazy('Will be shown after the name.'))
    title = models.CharField(
        max_length=50, blank=True, default='', verbose_name=ugettext_lazy("Title"),
        help_text=ugettext_lazy('Will be shown before the name.'))
    gender = models.CharField(
        max_length=50, choices=GENDER_CHOICES, blank=True,
        verbose_name=ugettext_lazy("Gender"), help_text=ugettext_lazy('Only for filtering the participant list.'))
    committee = models.CharField(
        max_length=255, blank=True, default='', verbose_name=ugettext_lazy("Committee"),
        help_text=ugettext_lazy('Only for filtering the participant list.'))
    about_me = models.TextField(
        blank=True, default='', verbose_name=ugettext_lazy('About me'),
        help_text=ugettext_lazy('Your profile text'))
    comment = models.TextField(
        blank=True, default='', verbose_name=ugettext_lazy('Comment'),
        help_text=ugettext_lazy('Only for notes.'))
    default_password = models.CharField(
        max_length=100, blank=True, default='',
        verbose_name=ugettext_lazy("Default password"))

    @property
    def clean_name(self):
        if self.title:
            name = "%s %s" % (self.title, self.get_full_name())
        else:
            name = self.get_full_name()
        return name or self.username

    def get_name_suffix(self):
        return self.structure_level

    def set_name_suffix(self, value):
        self.structure_level = value

    name_suffix = property(get_name_suffix, set_name_suffix)

    def reset_password(self, password=None):
        """
        Reset the password for the user to his default-password.
        """
        if password is None:
            password = self.default_password
        self.set_password(password)
        self.save()

    @property
    def sort_name(self):
        if config['participant_sort_users_by_first_name']:
            return self.first_name.lower()
        return self.last_name.lower()

    @models.permalink
    def get_absolute_url(self, link='detail'):
        """
        Return the URL to this user.

        link can be:
        * detail
        * edit
        * delete
        """
        if link == 'detail' or link == 'view':
            return ('user_view', [str(self.id)])
        if link == 'edit':
            return ('user_edit', [str(self.id)])
        if link == 'delete':
            return ('user_delete', [str(self.id)])

    def __unicode__(self):
        if self.name_suffix:
            return u"%s (%s)" % (self.clean_name, self.name_suffix)
        return u"%s" % self.clean_name

    class Meta:
        # Rename permissions
        permissions = (
            ('can_see_participant', ugettext_noop('Can see participants')),  # TODO: Add plural s to the codestring
            ('can_manage_participant', ugettext_noop('Can manage participants')),  # TODO: Add plural s to the codestring
        )
        ordering = ('last_name',)

    def slide(self):
        """
        Returns a map with the data for the slides.
        """
        return {
            'shown_user': self,
            'title': self.clean_name,
            'template': 'projector/UserSlide.html'}

register_slidemodel(User)


class Group(PersonMixin, Person, SlideMixin, DjangoGroup):
    prefix = 'group'  # This is for the slides
    person_prefix = 'group'

    django_group = models.OneToOneField(DjangoGroup, editable=False, parent_link=True)
    group_as_person = models.BooleanField(
        default=False, verbose_name=ugettext_lazy("Use this group as participant"),
        help_text=ugettext_lazy('For example as submitter of a motion.'))
    description = models.TextField(blank=True, verbose_name=ugettext_lazy("Description"))

    @models.permalink
    def get_absolute_url(self, link='detail'):
        """
        Return the URL to this user group.

        link can be:
        * view
        * edit
        * delete
        """
        if link == 'detail' or link == 'view':
            return ('user_group_view', [str(self.id)])
        if link == 'edit':
            return ('user_group_edit', [str(self.id)])
        if link == 'delete':
            return ('user_group_delete', [str(self.id)])

    def __unicode__(self):
        return unicode(self.name)

    class Meta:
        ordering = ('name',)

    def slide(self):
        """
        Returns a map with the data for the slides.
        """
        return {
            'group': self,
            'title': self.name,
            'template': 'projector/GroupSlide.html'}

register_slidemodel(Group)


class UsersAndGroupsToPersons(object):
    """
    Object to send all Users and Groups or a special User or Group to
    the Person-API via receice_persons()
    """
    def __init__(self, person_prefix_filter=None, id_filter=None):
        self.person_prefix_filter = person_prefix_filter
        self.id_filter = id_filter
        if config['participant_sort_users_by_first_name']:
            self.users = User.objects.all().order_by('first_name')
        else:
            self.users = User.objects.all().order_by('last_name')
        self.groups = Group.objects.filter(group_as_person=True)

    def __iter__(self):
        if (not self.person_prefix_filter or
                self.person_prefix_filter == User.person_prefix):
            if self.id_filter:
                try:
                    yield self.users.get(pk=self.id_filter)
                except User.DoesNotExist:
                    pass
            else:
                for user in self.users:
                    yield user

        if (not self.person_prefix_filter or
                self.person_prefix_filter == Group.person_prefix):
            if self.id_filter:
                try:
                    yield self.groups.get(pk=self.id_filter)
                except Group.DoesNotExist:
                    pass
            else:
                for group in self.groups:
                    yield group


@receiver(receive_persons, dispatch_uid="participant")
def receive_persons(sender, **kwargs):
    """
    Answers to the Person-API
    """
    return UsersAndGroupsToPersons(
        person_prefix_filter=kwargs['person_prefix_filter'],
        id_filter=kwargs['id_filter'])


@receiver(signals.post_save, sender=DjangoUser)
def djangouser_post_save(sender, instance, signal, *args, **kwargs):
    try:
        instance.user
    except User.DoesNotExist:
        User(django_user=instance).save_base(raw=True)


@receiver(signals.post_save, sender=DjangoGroup)
def djangogroup_post_save(sender, instance, signal, *args, **kwargs):
    try:
        instance.group
    except Group.DoesNotExist:
        Group(django_group=instance).save_base(raw=True)


@receiver(signals.post_save, sender=User)
def user_post_save(sender, instance, *args, **kwargs):
    if not kwargs['created']:
        return
    from openslides.participant.api import get_registered_group  # TODO: Test, if global import is possible
    registered = get_registered_group()
    instance.groups.add(registered)
    instance.save()


def get_protected_perm():
    """
    Returns the permission to manage participants. This function is a helper
    function used to protect manager users from locking out themselves.
    """
    return Permission.objects.get(
        content_type=ContentType.objects.get(app_label='participant', model='user'),
        codename='can_manage_participant')
