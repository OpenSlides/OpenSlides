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

from openslides.utils.person import PersonMixin
from openslides.utils.person.signals import receiv_persons

from openslides.config.signals import default_config_value


class User(DjangoUser, PersonMixin):
    person_prefix = 'user'
    GENDER_CHOICES = (
        ('male', _('Male')),
        ('female', _('Female')),
    )
    TYPE_CHOICE = (
        ('delegate', _('Delegate')),
        ('observer', _('Observer')),
        ('staff', _('Staff')),
        ('guest', _('Guest')),
    )

    django_user = models.OneToOneField(DjangoUser, editable=False, parent_link=True)
    category = models.CharField(
        max_length=100, null=True, blank=True, verbose_name=_("Category"),
        help_text=_('Will be shown behind the name.'))
    gender = models.CharField(
        max_length=50, choices=GENDER_CHOICES, blank=True,
        verbose_name=_("Gender"), help_text=_('Only for filter the userlist.'))
    type = models.CharField(
        max_length=100, choices=TYPE_CHOICE, blank=True,
        verbose_name=_("Typ"), help_text=_('Only for filter the userlist.'))
    committee = models.CharField(
        max_length=100, null=True, blank=True, verbose_name=_("Committee"),
        help_text=_('Only for filter the userlist.'))
    comment = models.TextField(
        null=True, blank=True, verbose_name=_('Comment'),
        help_text=_('Only for notes.'))
    # TODO: Rename this fild to default_password
    firstpassword = models.CharField(
        max_length=100, null=True, blank=True,
        verbose_name=_("First Password"))

    save_user_object = False

    def get_name_surfix(self):
        return self.category

    def set_name_surfix(self, value):
        self.category = value

    name_surfix = property(get_name_surfix, set_name_surfix)

    def reset_password(self, password=None):
        """
        Reset the password for the user to his default-password.
        """
        if password is None:
            password = self.firstpassword
        self.set_password(password)
        self.save()

    @models.permalink
    def get_absolute_url(self, link='edit'):
        """
        Return the URL to this user.

        link can be:
        * edit
        * delete
        """
        if link == 'edit':
            return ('user_edit', [str(self.id)])
        if link == 'delete':
            return ('user_delete', [str(self.id)])

    def __unicode__(self):
        name = self.get_full_name() or _("No Name yet")
        if self.name_surfix:
            return u"%s (%s)" % (name, self.name_surfix)
        return u"%s" % name

    class Meta:
        # Rename permissions
        permissions = (
            ('can_see_participant', ugettext_noop("Can see participant")),
            ('can_manage_participant',
                ugettext_noop("Can manage participant")),
        )


class Group(DjangoGroup, PersonMixin):
    person_prefix = 'group'

    django_group = models.OneToOneField(DjangoGroup, editable=False, parent_link=True)
    group_as_person = models.BooleanField(default=False)
    description = models.TextField(blank=True)

    @models.permalink
    def get_absolute_url(self, link='edit'):
        """
        Return the URL to this user.

        link can be:
        * edit
        * delete
        """
        if link == 'edit':
            return ('user_group_edit', [str(self.id)])
        if link == 'delete':
            return ('user_group_delete', [str(self.id)])

    def __unicode__(self):
        return unicode(self.name)


class UsersConnecter(object):
    def __init__(self, person_prefix=None, id=None):
        self.person_prefix = person_prefix
        self.id = id

    def __iter__(self):
        if (not self.person_prefix or
                self.person_prefix == User.person_prefix):
            if self.id:
                yield User.objects.get(pk=self.id)
            else:
                for user in User.objects.all():
                    yield user

        if (not self.person_prefix or
                self.person_prefix == Group.person_prefix):
            if self.id:
                yield Group.objects.filter(group_as_person=True).get(pk=self.id)
            else:
                for group in Group.objects.filter(group_as_person=True):
                    yield group

    def __getitem__(self, key):
        return User.objects.get(pk=key)


@receiver(receiv_persons, dispatch_uid="participant")
def receiv_persons(sender, **kwargs):
    return UsersConnecter(person_prefix=kwargs['person_prefix'],
                                    id=kwargs['id'])


@receiver(default_config_value, dispatch_uid="participant_default_config")
def default_config(sender, key, **kwargs):
    """
    Default values for the participant app.
    """
    # TODO: Rename config-vars
    return {
        'participant_pdf_system_url': 'http://example.com:8000',
        'participant_pdf_welcometext': _('Welcome to OpenSlides!'),
        'admin_password': None,
    }.get(key)


@receiver(signals.post_save, sender=DjangoUser)
def user_post_save(sender, instance, signal, *args, **kwargs):
    try:
        instance.user
    except User.DoesNotExist:
        User(django_user=instance).save_base(raw=True)


@receiver(signals.post_save, sender=DjangoGroup)
def group_post_save(sender, instance, signal, *args, **kwargs):
    try:
        instance.group
    except Group.DoesNotExist:
        Group(django_group=instance).save_base(raw=True)
