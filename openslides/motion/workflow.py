#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.utils.workflow
    ~~~~~~~~~~~~~~~~~~~~~~~~~

    Defines the workflows and states for motions. All states of a workflow
    are linked together with there 'next_state' attributes.

    :copyright: (c) 2011-2013 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.conf import settings
from django.core import exceptions
from django.db import models
from django.utils.importlib import import_module
from django.utils.translation import ugettext_noop

from openslides.utils.exceptions import OpenSlidesError

from .models import config


class WorkflowError(OpenSlidesError):
    """Exception raised when errors in a workflow or state accure."""
    pass


class State(models.Model):
    """Defines a state for a motion.

    The fields are:
        - 'name': a string representing the state.
        - 'action_word': an alternative string to be used for a button to switch to this state
        - 'next_states': a m2m relation to all states, that can be choosen from this state
        - 'icon': a string represention the url to the icon-image

    All the other arguments are boolean values. If True, the specific action for
    motions in this state.
        - 'allow_support': persons can support the motion in this state
        - 'allow_create_poll': polls can be created in this state
        - 'allow_submitter_edit':  the submitter can edit the motion in this state
        - 'automatic_versioning': editing the motion will create a new version as default
        - 'dont_set_new_version_active': new versions are not automaticly set active
    """
    name = models.CharField(max_length=255)
    action_word = models.CharField(max_length=255)
    next_states = models.ManyToManyField('self', symmetrical=False)
    icon = models.CharField(max_length=255)
    allow_support = models.BooleanField(default=False)
    allow_create_poll = models.BooleanField(default=False)
    allow_submitter_edit = models.BooleanField(default=False)
    automatic_versioning = models.BooleanField(default=False)
    dont_set_new_version_active = models.BooleanField(default=False)

    def __unicode__(self):
        """Returns the name of the state."""
        return self.name

    def get_action_word(self):
        """Returns the alternative name of the state if it exists."""
        return self.action_word or self.name

    def get_workflow(self):
        """Returns the workflow instance the state belongs to."""
        for workflow in Workflow.objects.all():
            if self in workflow.get_all_states():
                return workflow


class Workflow(models.Model):
    """Defines a workflow for a motion.

    The fields are:
        - 'name': a string representing the workflow
        - 'first_state': a one-to-one relation to a state, the starting point for the workflow
    """
    name = models.CharField(max_length=255)
    first_state = models.OneToOneField(State)

    def __unicode__(self):
        """Returns the name of the workflow."""
        return self.name

    def get_all_states(self):
        """Returns a list with all states which belong to a workflow."""
        all_states = []

        def _populate_states(parent_state):
            all_states.append(parent_state)
            for state in parent_state.next_states.all():
                if state not in all_states:
                    _populate_states(state)

        _populate_states(self.first_state)
        return all_states


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
    state_2_10 = State(name=ugettext_noop('rejected (not authorized)'), action_word=ugettext_noop('reject (not authorized)'), automatic_versioning=True)
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
