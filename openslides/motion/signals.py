# -*- coding: utf-8 -*-

from django.dispatch import receiver
from django.utils.translation import ugettext_noop

from openslides.core.signals import post_database_setup

from .models import State, Workflow


@receiver(post_database_setup, dispatch_uid='motion_create_builtin_workflows')
def create_builtin_workflows(sender, **kwargs):
    """
    Creates a simple and a complex workflow.
    """
    workflow_1, created = Workflow.objects.get_or_create(name=ugettext_noop('Simple Workflow'))
    if created:
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

    workflow_2, created = Workflow.objects.get_or_create(name=ugettext_noop('Complex Workflow'))
    if created:
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
                                         leave_old_version_active=True)
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
                                         action_word=ugettext_noop('Needs review'),
                                         versioning=True)
        state_2_10 = State.objects.create(name=ugettext_noop('rejected (not authorized)'),
                                          workflow=workflow_2,
                                          action_word=ugettext_noop('Reject (not authorized)'),
                                          versioning=True)
        state_2_1.next_states.add(state_2_2, state_2_5, state_2_10)
        state_2_2.next_states.add(state_2_3, state_2_4, state_2_5, state_2_6, state_2_7, state_2_8, state_2_9)
        workflow_2.first_state = state_2_1
        workflow_2.save()
