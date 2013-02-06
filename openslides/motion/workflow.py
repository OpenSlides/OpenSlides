#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.utils.workflow
    ~~~~~~~~~~~~~~~~~~~~~~~~~

    Defines the States for motions. All States are linked together with there
    'next_state' attributes. Together there are a workflow.

    :copyright: (c) 2011-2013 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.conf import settings
from django.core import exceptions
from django.utils.importlib import import_module
from django.utils.translation import ugettext_noop

from openslides.config.models import config

_workflow = None


class State(object):
    """Define a state for a motion."""
    def __init__(self, id, name, next_states=[], create_poll=False, support=False,
                 edit_as_submitter=False, version_permission=True):
        """Set attributes for the state.

        The Arguments are:
        - 'id' a unique id for the state.
        - 'name' a string representing the state.
        - 'next_states' a list with all states, that can be choosen from this state.

        All the other arguments are boolean values. If True, the specific action for
        motions in this state.
        - 'create_poll': polls can be created in this state.
        - 'support': persons can support the motion in this state.
        - 'edit_as_submitter':  the submitter can edit the motion in this state.
        - 'version_permission': new versions are not permitted.
        """
        self.id = id
        self.name = name
        self.next_states = next_states
        self.create_poll = create_poll
        self.support = support
        self.edit_as_submitter = edit_as_submitter
        self.version_permission = version_permission

    def __unicode__(self):
        """Return the name of the state."""
        return self.name


class WorkflowError(Exception):
    """Exception raised when errors in a state accure."""
    pass


def motion_workflow_choices():
    """Return all possible workflows.

    The possible workflows can be set in the settings with the setting
    'MOTION_WORKFLOW'.
    """
    for workflow in settings.MOTION_WORKFLOW:
        yield workflow[0], workflow[1]


def get_state(state='default'):
    """Return a state object.

    The argument 'state' has to be a state_id.

    If the argument 'state' is 'default', the default state is returned.

    The default state is the state object choosen in the config tab.
    """
    global _workflow
    if _workflow is not None:
        try:
            return _workflow[state]
        except KeyError:
            raise WorkflowError('Unknown state: %s' % state)
    _workflow = {}
    for workflow in settings.MOTION_WORKFLOW:
        if workflow[0] == config['motion_workflow']:
            try:
                wf_module, wf_default_state_name = workflow[2].rsplit('.', 1)
            except ValueError:
                raise exceptions.ImproperlyConfigured(
                    '%s isn\'t a workflow module' % workflow[2])
            try:
                mod = import_module(wf_module)
            except ImportError as e:
                raise exceptions.ImproperlyConfigured(
                    'Error importing workflow %s: "%s"' % (wf_module, e))
            try:
                default_state = getattr(mod, wf_default_state_name)
            except AttributeError:
                raise exceptions.ImproperlyConfigured(
                    'Workflow module "%s" does not define a "%s" State'
                    % (wf_module, wf_default_state_name))
            _workflow['default'] = default_state
            break
    else:
        raise ImproperlyConfigured('Unknown workflow %s' % conf['motion_workflow'])

    populate_workflow(default_state, _workflow)
    return get_state(state)


def populate_workflow(state, workflow):
    """Append all 'next_states' from state to the workflow.

    The argument state has to be a state object.

    The argument workflow has to be a dictonary.

    Calls this function recrusiv with all next_states from the next_states states.
    """
    workflow[state.id] = state
    for s in state.next_states:
        if s.id not in workflow:
            populate_workflow(s, workflow)


DUMMY_STATE = State('dummy', ugettext_noop('Unknwon state'))
"""A dummy state object. Returned, if the state_id is not known."""

default_workflow = State('pub', ugettext_noop('Published'), support=True,
                         edit_as_submitter=True, version_permission=False)
"""Default Workflow for OpenSlides."""

default_workflow.next_states = [
    State('per', ugettext_noop('Permitted'), create_poll=True, edit_as_submitter=True, next_states=[
        State('acc', ugettext_noop('Accepted')),
        State('rej', ugettext_noop('Rejected')),
        State('wit', ugettext_noop('Withdrawed')),
        State('adj', ugettext_noop('Adjourned')),
        State('noc', ugettext_noop('Not Concerned')),
        State('com', ugettext_noop('Commited a bill')),
        State('rev', ugettext_noop('Needs Review'))]),
    State('nop', ugettext_noop('Rejected (not authorized)'))]
