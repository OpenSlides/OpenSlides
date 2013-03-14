#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.motion.signals
    ~~~~~~~~~~~~~~~~~~~~~~~~~

    Signals for the motion app.

    :copyright: (c) 2011-2013 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.dispatch import receiver
from django.utils.translation import ugettext as _, ugettext_noop

from openslides.config.signals import default_config_value
from openslides.core.signals import post_database_setup

from .models import Workflow, State


@receiver(default_config_value, dispatch_uid="motion_default_config")
def default_config(sender, key, **kwargs):
    """Return the default config values for the motion app."""
    return {
        'motion_min_supporters': 0,
        'motion_preamble': _('The assembly may decide,'),
        'motion_pdf_ballot_papers_selection': 'CUSTOM_NUMBER',
        'motion_pdf_ballot_papers_number': '8',
        'motion_pdf_title': _('Motions'),
        'motion_pdf_preamble': '',
        'motion_allow_disable_versioning': False,
        'motion_workflow': 1}.get(key)


@receiver(post_database_setup, dispatch_uid='motion_create_builtin_workflows')
def create_builtin_workflows(sender, **kwargs):
    """
    Creates a simple and a complex workflow.
    """
    workflow_1 = Workflow.objects.create(name=ugettext_noop('Simple Workflow'))
    state_1_1 = State.objects.create(name=ugettext_noop('submitted'),
                                     workflow=workflow_1,
                                     allow_create_poll=True,
                                     allow_support=True,
                                     allow_submitter_edit=True)
    state_1_2 = State.objects.create(name=ugettext_noop('accepted'),
                                     workflow=workflow_1,
                                     action_word=ugettext_noop('Accept'))
    state_1_3 = State.objects.create(name=ugettext_noop('rejected'),
                                     workflow=workflow_1,
                                     action_word=ugettext_noop('Reject'))
    state_1_4 = State.objects.create(name=ugettext_noop('not decided'),
                                     workflow=workflow_1,
                                     action_word=ugettext_noop('Do not decide'))
    state_1_1.next_states.add(state_1_2, state_1_3, state_1_4)
    workflow_1.first_state = state_1_1
    workflow_1.save()

    workflow_2 = Workflow.objects.create(name=ugettext_noop('Complex Workflow'))
    state_2_1 = State.objects.create(name=ugettext_noop('published'),
                                     workflow=workflow_2,
                                     allow_support=True,
                                     allow_submitter_edit=True,
                                     dont_set_identifier=True)
    state_2_2 = State.objects.create(name=ugettext_noop('permitted'),
                                     workflow=workflow_2,
                                     action_word=ugettext_noop('Permit'),
                                     allow_create_poll=True,
                                     allow_submitter_edit=True,
                                     versioning=True,
                                     dont_set_new_version_active=True)
    state_2_3 = State.objects.create(name=ugettext_noop('accepted'),
                                     workflow=workflow_2,
                                     action_word=ugettext_noop('Accept'),
                                     versioning=True)
    state_2_4 = State.objects.create(name=ugettext_noop('rejected'),
                                     workflow=workflow_2,
                                     action_word=ugettext_noop('Reject'),
                                     versioning=True)
    state_2_5 = State.objects.create(name=ugettext_noop('withdrawed'),
                                     workflow=workflow_2,
                                     action_word=ugettext_noop('Withdraw'),
                                     versioning=True)
    state_2_6 = State.objects.create(name=ugettext_noop('adjourned'),
                                     workflow=workflow_2,
                                     action_word=ugettext_noop('Adjourn'),
                                     versioning=True)
    state_2_7 = State.objects.create(name=ugettext_noop('not concerned'),
                                     workflow=workflow_2,
                                     action_word=ugettext_noop('Do not concern'),
                                     versioning=True)
    state_2_8 = State.objects.create(name=ugettext_noop('commited a bill'),
                                     workflow=workflow_2,
                                     action_word=ugettext_noop('Commit a bill'),
                                     versioning=True)
    state_2_9 = State.objects.create(name=ugettext_noop('needs review'),
                                     workflow=workflow_2,
                                     versioning=True)
    state_2_10 = State.objects.create(name=ugettext_noop('rejected (not authorized)'),
                                      workflow=workflow_2,
                                      action_word=ugettext_noop('reject (not authorized)'),
                                      versioning=True)
    state_2_1.next_states.add(state_2_2, state_2_5, state_2_10)
    state_2_2.next_states.add(state_2_3, state_2_4, state_2_5, state_2_6, state_2_7, state_2_8, state_2_9)
    workflow_2.first_state = state_2_1
    workflow_2.save()
