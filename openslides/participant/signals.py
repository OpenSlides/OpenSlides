#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.participant.signals
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Signals for the participant app.

    :copyright: (c) 2011–2013 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.dispatch import receiver
from django import forms
from django.utils.translation import ugettext_noop, ugettext_lazy, ugettext as _
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth.models import Permission

from openslides.core.signals import post_database_setup
from openslides.config.signals import config_signal
from openslides.config.api import ConfigVariable, ConfigPage

from .models import Group


@receiver(config_signal, dispatch_uid='setup_participant_config_page')
def setup_participant_config_page(sender, **kwargs):
    """
    Participant config variables.
    """
    # TODO: Rename config-vars
    participant_pdf_system_url = ConfigVariable(
        name='participant_pdf_system_url',
        default_value='http://example.com:8000',
        form_field=forms.CharField(
            widget=forms.TextInput(),
            required=False,
            label=_('System URL'),
            help_text=_('Printed in PDF of first time passwords only.')))
    participant_pdf_welcometext = ConfigVariable(
        name='participant_pdf_welcometext',
        default_value=_('Welcome to OpenSlides!'),
        form_field=forms.CharField(
            widget=forms.Textarea(),
            required=False,
            label=_('Welcome text'),
            help_text=_('Printed in PDF of first time passwords only.')))
    participant_sort_users_by_first_name = ConfigVariable(
        name='participant_sort_users_by_first_name',
        default_value=False,
        form_field=forms.BooleanField(
            required=False,
            label=_('Sort participants by first name'),
            help_text=_('Disable for sorting by last name')))

    return ConfigPage(title=ugettext_noop('Participant'),
                      url='participant',
                      required_permission='config.can_manage',
                      weight=50,
                      variables=(participant_pdf_system_url,
                                 participant_pdf_welcometext,
                                 participant_sort_users_by_first_name))


@receiver(post_database_setup, dispatch_uid='participant_create_builtin_groups')
def create_builtin_groups(sender, **kwargs):
    """
    Creates the builtin groups: Anonymous, Registered, Delegates and Staff.
    """
    # Check whether the group pks 1 to 4 are free
    for pk in range(1, 5):
        assert not Group.objects.filter(pk=pk).exists(), 'There should not be any group with pk 1, 2, 3 or 4.'

    # Anonymous and Registered
    ct_projector = ContentType.objects.get(app_label='projector', model='projectorslide')
    perm_1 = Permission.objects.get(content_type=ct_projector, codename='can_see_projector')
    perm_2 = Permission.objects.get(content_type=ct_projector, codename='can_see_dashboard')

    ct_agenda = ContentType.objects.get(app_label='agenda', model='item')
    ct_speaker = ContentType.objects.get(app_label='agenda', model='speaker')
    perm_3 = Permission.objects.get(content_type=ct_agenda, codename='can_see_agenda')
    perm_3a = Permission.objects.get(content_type=ct_agenda, codename='can_see_orga_items')
    can_speak = Permission.objects.get(content_type=ct_speaker, codename='can_be_speaker')

    ct_motion = ContentType.objects.get(app_label='motion', model='motion')
    perm_4 = Permission.objects.get(content_type=ct_motion, codename='can_see_motion')

    ct_assignment = ContentType.objects.get(app_label='assignment', model='assignment')
    perm_5 = Permission.objects.get(content_type=ct_assignment, codename='can_see_assignment')

    ct_participant = ContentType.objects.get(app_label='participant', model='user')
    perm_6 = Permission.objects.get(content_type=ct_participant, codename='can_see_participant')

    ct_mediafile = ContentType.objects.get(app_label='mediafile', model='mediafile')
    perm_6a = Permission.objects.get(content_type=ct_mediafile, codename='can_see')

    group_anonymous = Group.objects.create(name=ugettext_noop('Anonymous'), pk=1)
    group_anonymous.permissions.add(perm_1, perm_2, perm_3, perm_3a, perm_4, perm_5, perm_6, perm_6a)
    group_registered = Group.objects.create(name=ugettext_noop('Registered'), pk=2)
    group_registered.permissions.add(perm_1, perm_2, perm_3, perm_3a, perm_4, perm_5, perm_6, perm_6a, can_speak)

    # Delegates
    perm_7 = Permission.objects.get(content_type=ct_motion, codename='can_create_motion')
    perm_8 = Permission.objects.get(content_type=ct_motion, codename='can_support_motion')
    perm_9 = Permission.objects.get(content_type=ct_assignment, codename='can_nominate_other')
    perm_10 = Permission.objects.get(content_type=ct_assignment, codename='can_nominate_self')
    perm_10a = Permission.objects.get(content_type=ct_mediafile, codename='can_upload')

    group_delegates = Group.objects.create(name=ugettext_noop('Delegates'), pk=3)
    group_delegates.permissions.add(perm_7, perm_8, perm_9, perm_10, perm_10a)

    # Staff
    perm_11 = Permission.objects.get(content_type=ct_agenda, codename='can_manage_agenda')
    perm_12 = Permission.objects.get(content_type=ct_motion, codename='can_manage_motion')
    perm_13 = Permission.objects.get(content_type=ct_assignment, codename='can_manage_assignment')
    perm_14 = Permission.objects.get(content_type=ct_participant, codename='can_manage_participant')
    perm_15 = Permission.objects.get(content_type=ct_projector, codename='can_manage_projector')
    perm_15a = Permission.objects.get(content_type=ct_mediafile, codename='can_manage')

    ct_config = ContentType.objects.get(app_label='config', model='configstore')
    perm_16 = Permission.objects.get(content_type=ct_config, codename='can_manage')

    group_staff = Group.objects.create(name=ugettext_noop('Staff'), pk=4)
    group_staff.permissions.add(perm_7, perm_9, perm_10, perm_10a, perm_11, perm_12, perm_13, perm_14, perm_15, perm_15a, perm_16)
