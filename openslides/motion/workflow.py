#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.motion.workflow
    ~~~~~~~~~~~~~~~~~~~~~~~~~

    :copyright: (c) 2011-2013 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.utils.translation import ugettext_noop

from .models import Workflow, State


def init_builtin_workflows():
    """
    Saves a simple and a complex workflow into the database. This function is only called manually.
    """
    workflow_1 = Workflow(name=ugettext_noop('Simple Workflow'), id=1)
    state_1_1 = State.objects.create(name=ugettext_noop('submitted'), workflow=workflow_1,
                                     allow_create_poll=True, allow_support=True, allow_submitter_edit=True)
    state_1_2 = State.objects.create(name=ugettext_noop('accepted'), workflow=workflow_1, action_word=ugettext_noop('accept'))
    state_1_3 = State.objects.create(name=ugettext_noop('rejected'), workflow=workflow_1, action_word=ugettext_noop('reject'))
    state_1_4 = State.objects.create(name=ugettext_noop('not decided'), workflow=workflow_1, action_word=ugettext_noop('do not decide'))
    state_1_1.next_states.add(state_1_2, state_1_3, state_1_4)
    state_1_1.save()  # Is this neccessary?
    workflow_1.first_state = state_1_1
    workflow_1.save()

    workflow_2 = Workflow(name=ugettext_noop('Complex Workflow'), id=2)
    state_2_1 = State.objects.create(name=ugettext_noop('published'), workflow=workflow_2, allow_support=True, allow_submitter_edit=True)
    state_2_2 = State.objects.create(name=ugettext_noop('permitted'), workflow=workflow_2, action_word=ugettext_noop('permit'),
                                     allow_create_poll=True, allow_submitter_edit=True, versioning=True, dont_set_new_version_active=True)
    state_2_3 = State.objects.create(name=ugettext_noop('accepted'), workflow=workflow_2, action_word=ugettext_noop('accept'), versioning=True)
    state_2_4 = State.objects.create(name=ugettext_noop('rejected'), workflow=workflow_2, action_word=ugettext_noop('reject'), versioning=True)
    state_2_5 = State.objects.create(name=ugettext_noop('withdrawed'), workflow=workflow_2,
                                     action_word=ugettext_noop('withdraw'), versioning=True)
    state_2_6 = State.objects.create(name=ugettext_noop('adjourned'), workflow=workflow_2, action_word=ugettext_noop('adjourn'), versioning=True)
    state_2_7 = State.objects.create(name=ugettext_noop('not concerned'), workflow=workflow_2, versioning=True)
    state_2_8 = State.objects.create(name=ugettext_noop('commited a bill'), workflow=workflow_2,
                                     action_word=ugettext_noop('commit a bill'), versioning=True)
    state_2_9 = State.objects.create(name=ugettext_noop('needs review'), workflow=workflow_2, versioning=True)
    state_2_10 = State.objects.create(name=ugettext_noop('rejected (not authorized)'), workflow=workflow_2,
                                      action_word=ugettext_noop('reject (not authorized)'), versioning=True)
    state_2_1.next_states.add(state_2_2, state_2_5, state_2_10)
    state_2_2.next_states.add(state_2_3, state_2_4, state_2_5, state_2_6, state_2_7, state_2_8, state_2_9)
    state_2_1.save()  # Is this neccessary?
    state_2_2.save()  # Is this neccessary?
    workflow_2.first_state = state_2_1
    workflow_2.save()
