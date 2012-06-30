#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.participant.models
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Models for the participant app.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.db import models
from django.db.models import Q
from django.contrib.auth.models import User

from utils.translation_ext import ugettext as _
from participant.api import gen_password

class Profile(models.Model):
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
        verbose_name = _("Gender"), help_text=_('Only for filter the userlist.'))
    type = models.CharField(max_length=100, choices=TYPE_CHOICE, blank=True,
        verbose_name = _("Typ"), help_text=_('Only for filter the userlist.'))
    committee = models.CharField(max_length=100, null=True, blank=True,
        verbose_name = _("Committee"), help_text=_('Only for filter the userlist.'))
    comment = models.TextField(null=True, blank=True, verbose_name = _('Comment'),
        help_text=_('Only for notes.'))
    firstpassword = models.CharField(max_length=100, null=True, blank=True,
        verbose_name = _("First Password"))


    def reset_password(self):
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
            ('can_see_participant', _("Can see participant", fixstr=True)),
            ('can_manage_participant', _("Can manage participant", fixstr=True)),
        )


from django.dispatch import receiver
from openslides.config.signals import default_config_value


@receiver(default_config_value, dispatch_uid="participant_default_config")
def default_config(sender, key, **kwargs):
    return {
        'participant_pdf_system_url': 'http://example.com:8000',
        'participant_pdf_welcometext': _('Welcome to OpenSlides!'),
    }.get(key)
