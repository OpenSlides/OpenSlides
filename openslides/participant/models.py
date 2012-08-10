#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.participant.models
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Models for the participant app.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.contrib.auth.models import User, Group
from django.db import models
from django.db.models import Q, signals
from django.dispatch import receiver
from django.utils.translation import ugettext_lazy as _, ugettext_noop

from openslides.utils.person import PersonMixin
from openslides.utils.person.signals import receiv_persons

from openslides.config.signals import default_config_value


class OpenSlidesUser(models.Model, PersonMixin):
    person_prefix = 'openslides_user'
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

    user = models.OneToOneField(User, unique=True, editable=False)
    category = models.CharField(
        max_length=100, null=True, blank=True, verbose_name=_("Category"),
        help_text=_('Shown behind the name.'))
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
    firstpassword = models.CharField(
        max_length=100, null=True, blank=True,
        verbose_name=_("First Password"))

    save_user_object = False

    def get_name_surfix(self):
        return self.category

    def set_name_surfix(self, value):
        self.category = value

    name_surfix = property(get_name_surfix, set_name_surfix)

    def get_first_name(self):
        return self.user.first_name

    def set_first_name(self, first_name):
        self.user.first_name = first_name
        self.save_user_object = True

    first_name = property(get_first_name, set_first_name)

    def get_full_name(self):
        return "%s %s" % self.first_name, self.last_name

    def get_last_name(self):
        return self.user.last_name

    def set_last_name(self, last_name):
        self.user.last_name = last_name
        self.save_user_object = True

    last_name = property(get_last_name, set_last_name)

    def reset_password(self, password=None):
        """
        Reset the password for the user to his default-password.
        """
        if password is None:
            password = self.firstpassword
        self.user.set_password(password)
        self.user.save()

    def has_perm(self, perm):
        return self.user.has_perm(perm)

    def save_in_user_object(self, attribute, value):
        self.save_in_user_object_dict[attribute] = value

    @models.permalink
    def get_absolute_url(self, link='edit'):
        """
        Return the URL to this user.

        link can be:
        * edit
        * delete
        """
        if link == 'edit':
            return ('user_edit', [str(self.user.id)])
        if link == 'delete':
            return ('user_delete', [str(self.user.id)])

    def __unicode__(self):
        if self.name_surfix:
            return u"%s (%s)" % (self.get_full_name(), self.name_surfix)
        return u"%s" % self.get_full_name()

    def save(self, *args, **kwargs):
        if self.save_user_object:
            self.user.save()
            self.save_user_object = False
        super(OpenSlidesUser, self).save(*args, **kwargs)

    class Meta:
        # Rename permissions
        permissions = (
            ('can_see_participant', ugettext_noop("Can see participant")),
            ('can_manage_participant',
                ugettext_noop("Can manage participant")),
        )


class OpenSlidesGroup(models.Model, PersonMixin):
    person_prefix = 'openslides_group'

    group = models.OneToOneField(Group)
    group_as_person = models.BooleanField(default=False)
    description = models.TextField(blank=True)

    def __unicode__(self):
        return unicode(self.group)


class OpenSlidesUsersConnecter(object):
    def __init__(self, person_prefix=None, id=None):
        self.person_prefix = person_prefix
        self.id = id

    def __iter__(self):
        if (not self.person_prefix or
                self.person_prefix == OpenSlidesUser.person_prefix):
            if self.id:
                yield OpenSlidesUser.objects.get(pk=self.id)
            else:
                for user in OpenSlidesUser.objects.all():
                    yield user

        if (not self.person_prefix or
                self.person_prefix == OpenSlidesGroup.person_prefix):
            if self.id:
                yield OpenSlidesGroup.objects.get(pk=self.id)
            else:
                for group in OpenSlidesGroup.objects.all():
                    yield group

    def __getitem__(self, key):
        return OpenSlidesUser.objects.get(pk=key)


@receiver(receiv_persons, dispatch_uid="participant")
def receiv_persons(sender, **kwargs):
    return OpenSlidesUsersConnecter(person_prefix=kwargs['person_prefix'],
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


@receiver(signals.post_save, sender=User)
def user_post_save(sender, instance, signal, *args, **kwargs):
    # Creates OpenSlidesUser
    openslidesuser, new = OpenSlidesUser.objects.get_or_create(user=instance)


@receiver(signals.post_save, sender=Group)
def group_post_save(sender, instance, signal, *args, **kwargs):
    # Creates OpenSlidesGroup
    openslidesgroup, new = OpenSlidesGroup.objects.get_or_create(group=instance)
