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
from django.db.models import Q
from django.dispatch import receiver
from django.utils.translation import ugettext_lazy as _, ugettext_noop

from openslides.utils.user import UserMixin
from openslides.utils.user.signals import receiv_users

from openslides.config.signals import default_config_value


class Profile(models.Model, UserMixin):
    user_prefix = 'participant'
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
    group = models.CharField(max_length=100, null=True, blank=True,
        verbose_name = _("Group"), help_text=_('Shown behind the name.'))
    gender = models.CharField(max_length=50, choices=GENDER_CHOICES, blank=True,
        verbose_name = _("Gender"),
        help_text=_('Only for filter the userlist.'))
    type = models.CharField(max_length=100, choices=TYPE_CHOICE, blank=True,
        verbose_name = _("Typ"), help_text=_('Only for filter the userlist.'))
    committee = models.CharField(max_length=100, null=True, blank=True,
        verbose_name = _("Committee"),
        help_text=_('Only for filter the userlist.'))
    comment = models.TextField(null=True, blank=True,
        verbose_name = _('Comment'), help_text=_('Only for notes.'))
    firstpassword = models.CharField(max_length=100, null=True, blank=True,
        verbose_name = _("First Password"))

    def reset_password(self):
        """
        Reset the password for the user to his default-password.
        """
        self.user.set_password(self.firstpassword)
        self.user.save()

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
        if self.group:
            return "%s (%s)" % (self.user.get_full_name(), self.group)
        return "%s" % self.user.get_full_name()


    class Meta:
        permissions = (
            ('can_see_participant', ugettext_noop("Can see participant")),
            ('can_manage_participant', ugettext_noop("Can manage participant")),
        )


class DjangoGroup(models.Model, UserMixin):
    user_prefix = 'djangogroup'

    group = models.OneToOneField(Group)

    def __unicode__(self):
        return unicode(self.group)


class DjangoUser(User, UserMixin):
    user_prefix = 'djangouser'

    def has_no_profile(self):
        # TODO: Make ths with a Manager, so it does manipulate the sql query
        return not hasattr(self, 'profile')

    class Meta:
        proxy = True


class ParticipantUsers(object):
    def __init__(self, user_prefix=None, id=None):
        self.user_prefix = user_prefix
        self.id = id

    def __iter__(self):
        if not self.user_prefix or self.user_prefix == Profile.user_prefix:
            if self.id:
                yield Profile.objects.get(pk=self.id)
            else:
                for profile in Profile.objects.all():
                    yield profile

        if not self.user_prefix or self.user_prefix == DjangoGroup.user_prefix:
            if self.id:
                yield DjangoGroup.objects.get(pk=self.id)
            else:
                for group in DjangoGroup.objects.all():
                    yield group

        if not self.user_prefix or self.user_prefix == DjangoUser.user_prefix:
            if self.id:
                yield DjangoUser.objects.get(pk=self.id)
            else:
                for user in DjangoUser.objects.all():
                    if user.has_no_profile():
                        yield user
                    elif self.user_prefix:
                        # If only users where requested, return the profile object.
                        yield user.profile

    def __getitem__(self, key):
        return Profile.objects.get(pk=key)


@receiver(receiv_users, dispatch_uid="participant_profile")
def receiv_users(sender, **kwargs):
    return ParticipantUsers(user_prefix=kwargs['user_prefix'], id=kwargs['id'])


@receiver(default_config_value, dispatch_uid="participant_default_config")
def default_config(sender, key, **kwargs):
    """
    Default values for the participant app.
    """
    return {
        'participant_pdf_system_url': 'http://example.com:8000',
        'participant_pdf_welcometext': _('Welcome to OpenSlides!'),
        'admin_password': None,
    }.get(key)
