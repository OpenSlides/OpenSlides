#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.participant.models
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Models for the participant app.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.contrib.auth.models import User as DjangoUser, Group as DjangoGroup
from django.db import models
from django.db.models import signals
from django.dispatch import receiver
from django.utils.translation import ugettext_lazy as _, ugettext_noop

from openslides.utils.person import PersonMixin, Person
from openslides.utils.person.signals import receive_persons

from openslides.config.models import config
from openslides.config.signals import default_config_value

from openslides.projector.api import register_slidemodel
from openslides.projector.projector import SlideMixin


class User(DjangoUser, PersonMixin, Person, SlideMixin):
    prefix = 'user'  # This is for the slides
    person_prefix = 'user'
    GENDER_CHOICES = (
        ('male', _('Male')),
        ('female', _('Female')),
    )
    TYPE_CHOICES = (
        ('delegate', _('Delegate')),
        ('observer', _('Observer')),
        ('staff', _('Staff')),
        ('guest', _('Guest')),
    )

    django_user = models.OneToOneField(DjangoUser, editable=False, parent_link=True)
    structure_level = models.CharField(
        max_length=100, blank=True, default='', verbose_name=_("Structure level"),
        help_text=_('Will be shown after the name.'))
    gender = models.CharField(
        max_length=50, choices=GENDER_CHOICES, blank=True,
        verbose_name=_("Gender"), help_text=_('Only for filtering the participant list.'))
    type = models.CharField(
        max_length=100, choices=TYPE_CHOICES, blank=True,
        verbose_name=_("Typ"), help_text=_('Only for filtering the participant list.'))
    committee = models.CharField(
        max_length=100, blank=True, default='', verbose_name=_("Committee"),
        help_text=_('Only for filtering the participant list.'))
    about_me = models.TextField(
        blank=True, default='', verbose_name=_('About me'),
        help_text=_('Your profile text'))
    comment = models.TextField(
        blank=True, default='', verbose_name=_('Comment'),
        help_text=_('Only for notes.'))
    default_password = models.CharField(
        max_length=100, blank=True, default='',
        verbose_name=_("Default password"))

    @property
    def clean_name(self):
        return self.get_full_name() or self.username

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
    def get_absolute_url(self, link='view'):
        """
        Return the URL to this user.

        link can be:
        * view
        * edit
        * delete
        """
        if link == 'view':
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
            ('can_see_participant', ugettext_noop("Can see participant")),
            ('can_manage_participant',
                ugettext_noop("Can manage participant")),
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


class Group(DjangoGroup, PersonMixin, Person, SlideMixin):
    prefix = 'group'  # This is for the slides
    person_prefix = 'group'

    django_group = models.OneToOneField(DjangoGroup, editable=False, parent_link=True)
    group_as_person = models.BooleanField(
        default=False, verbose_name=_("Use this group as participant"),
        help_text=_('For example as submitter of a motion.'))
    description = models.TextField(blank=True, verbose_name=_("Description"))

    @models.permalink
    def get_absolute_url(self, link='view'):
        """
        Return the URL to this user group.

        link can be:
        * view
        * edit
        * delete
        """
        if link == 'view':
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


@receiver(default_config_value, dispatch_uid="participant_default_config")
def default_config(sender, key, **kwargs):
    """
    Default values for the participant app.
    """
    # TODO: Rename config-vars
    return {
        'participant_pdf_system_url': 'http://example.com:8000',
        'participant_pdf_welcometext': _('Welcome to OpenSlides!'),
        'participant_sort_users_by_first_name': False,
    }.get(key)


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
    from openslides.participant.api import get_or_create_registered_group
    if not kwargs['created']:
        return
    registered = get_or_create_registered_group()
    instance.groups.add(registered)
    instance.save()
