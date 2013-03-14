#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.participant.signals
    ~~~~~~~~~~~~~~~~~~~~~~~~~

    Signals for the participant app.

    :copyright: (c) 2011-2013 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.dispatch import receiver
from django.utils.translation import ugettext_noop
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth.models import Permission

from openslides.core.signals import post_database_setup

from .models import Group


@receiver(post_database_setup, dispatch_uid='participant_create_builtin_groups')
def create_builtin_groups(sender, **kwargs):
    """
    Creates the builtin groups: Anonymous, Registered, Delegates and Staff.
    """
    # Anonymous and Registered
    ct_projector = ContentType.objects.get(app_label='projector', model='projectorslide')
    perm_1 = Permission.objects.get(content_type=ct_projector, codename='can_see_projector')
    perm_2 = Permission.objects.get(content_type=ct_projector, codename='can_see_dashboard')

    ct_agenda = ContentType.objects.get(app_label='agenda', model='item')
    perm_3 = Permission.objects.get(content_type=ct_agenda, codename='can_see_agenda')

    ct_motion = ContentType.objects.get(app_label='motion', model='motion')
    perm_4 = Permission.objects.get(content_type=ct_motion, codename='can_see_motion')

    ct_assignment = ContentType.objects.get(app_label='assignment', model='assignment')
    perm_5 = Permission.objects.get(content_type=ct_assignment, codename='can_see_assignment')

    ct_participant = ContentType.objects.get(app_label='participant', model='user')
    perm_6 = Permission.objects.get(content_type=ct_participant, codename='can_see_participant')

    group_anonymous = Group.objects.create(name=ugettext_noop('Anonymous'))
    group_anonymous.permissions.add(perm_1, perm_2, perm_3, perm_4, perm_5, perm_6)
    group_registered = Group.objects.create(name=ugettext_noop('Registered'))
    group_registered.permissions.add(perm_1, perm_2, perm_3, perm_4, perm_5, perm_6)

    # Delegates
    perm_7 = Permission.objects.get(content_type=ct_motion, codename='can_create_motion')
    perm_8 = Permission.objects.get(content_type=ct_motion, codename='can_support_motion')
    perm_9 = Permission.objects.get(content_type=ct_assignment, codename='can_nominate_other')
    perm_10 = Permission.objects.get(content_type=ct_assignment, codename='can_nominate_self')

    group_delegates = Group.objects.create(name=ugettext_noop('Delegates'))
    group_delegates.permissions.add(perm_7, perm_8, perm_9, perm_10)

    # Staff
    perm_11 = Permission.objects.get(content_type=ct_agenda, codename='can_manage_agenda')
    perm_12 = Permission.objects.get(content_type=ct_motion, codename='can_manage_motion')
    perm_13 = Permission.objects.get(content_type=ct_assignment, codename='can_manage_assignment')
    perm_14 = Permission.objects.get(content_type=ct_participant, codename='can_manage_participant')
    perm_15 = Permission.objects.get(content_type=ct_projector, codename='can_manage_projector')

    ct_config = ContentType.objects.get(app_label='config', model='configstore')
    perm_16 = Permission.objects.get(content_type=ct_config, codename='can_manage_config')

    group_staff = Group.objects.create(name=ugettext_noop('Staff'))
    group_staff.permissions.add(perm_7, perm_9, perm_10, perm_11, perm_12, perm_13, perm_14, perm_15, perm_16)
