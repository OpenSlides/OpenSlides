#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.motion.workflow
    ~~~~~~~~~~~~~~~~~~~~~~~~~

    :copyright: (c) 2011-2013 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""


def init_builtin_workflows():
    """
    Saves a simple and a complex workflow into the database. This function is only called manually.
    """
    state_1_1 = State(name=ugettext_noop('submitted'), allow_create_poll=True, allow_support=True, allow_submitter_edit=True)
    state_1_2 = State(name=ugettext_noop('accepted'), action_word=ugettext_noop('accept'))
    state_1_3 = State(name=ugettext_noop('rejected'), action_word=ugettext_noop('reject'))
    state_1_4 = State(name=ugettext_noop('not decided'), action_word=ugettext_noop('do not decide'))
    state_1_1.save()
    state_1_2.save()
    state_1_3.save()
    state_1_4.save()
    state_1_1.next_states.add(state_1_2, state_1_3, state_1_4)
    state_1_1.save()  # Is this neccessary?
    Workflow.objects.create(name=ugettext_noop('Simple Workflow'), first_state=state_1_1)

    state_2_1 = State(name=ugettext_noop('published'), allow_support=True, allow_submitter_edit=True)
    state_2_2 = State(name=ugettext_noop('permitted'), action_word=ugettext_noop('permit'),
                      allow_create_poll=True, allow_submitter_edit=True, automatic_versioning=True, dont_set_new_version_active=True)
    state_2_3 = State(name=ugettext_noop('accepted'), action_word=ugettext_noop('accept'), automatic_versioning=True)
    state_2_4 = State(name=ugettext_noop('rejected'), action_word=ugettext_noop('reject'), automatic_versioning=True)
    state_2_5 = State(name=ugettext_noop('withdrawed'), action_word=ugettext_noop('withdraw'), automatic_versioning=True)
    state_2_6 = State(name=ugettext_noop('adjourned'), action_word=ugettext_noop('adjourn'), automatic_versioning=True)
    state_2_7 = State(name=ugettext_noop('not concerned'), automatic_versioning=True)
    state_2_8 = State(name=ugettext_noop('commited a bill'), action_word=ugettext_noop('commit a bill'), automatic_versioning=True)
    state_2_9 = State(name=ugettext_noop('needs review'), automatic_versioning=True)
    state_2_10 = State(name=ugettext_noop('rejected (not authorized)'),
                       action_word=ugettext_noop('reject (not authorized)'), automatic_versioning=True)
    state_2_1.save()
    state_2_2.save()
    state_2_3.save()
    state_2_4.save()
    state_2_5.save()
    state_2_6.save()
    state_2_7.save()
    state_2_8.save()
    state_2_9.save()
    state_2_10.save()
    state_2_1.next_states.add(state_2_2, state_2_5, state_2_10)
    state_2_2.next_states.add(state_2_3, state_2_4, state_2_5, state_2_6, state_2_7, state_2_8, state_2_9)
    state_2_1.save()  # Is this neccessary?
    state_2_2.save()  # Is this neccessary?
    Workflow.objects.create(name=ugettext_noop('Complex Workflow'), first_state=state_2_1)
