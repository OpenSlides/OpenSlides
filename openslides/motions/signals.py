from django.apps import apps
from django.utils.translation import ugettext_noop

from .models import State, Workflow


def create_builtin_workflows(sender, **kwargs):
    """
    Receiver function to create a simple and a complex workflow. It is
    connected to the signal django.db.models.signals.post_migrate during
    app loading.
    """
    if Workflow.objects.exists():
        # If there is at least one workflow, then do nothing.
        return

    workflow_1 = Workflow.objects.create(name='Simple Workflow')
    state_1_1 = State.objects.create(name=ugettext_noop('submitted'),
                                     workflow=workflow_1,
                                     allow_create_poll=True,
                                     allow_support=True,
                                     allow_submitter_edit=True)
    state_1_2 = State.objects.create(name=ugettext_noop('accepted'),
                                     workflow=workflow_1,
                                     action_word='Accept',
                                     recommendation_label='Acceptance',
                                     css_class='success')
    state_1_3 = State.objects.create(name=ugettext_noop('rejected'),
                                     workflow=workflow_1,
                                     action_word='Reject',
                                     recommendation_label='Rejection',
                                     css_class='danger')
    state_1_4 = State.objects.create(name=ugettext_noop('not decided'),
                                     workflow=workflow_1,
                                     action_word='Do not decide',
                                     recommendation_label='No decision',
                                     css_class='default')
    state_1_1.next_states.add(state_1_2, state_1_3, state_1_4)
    workflow_1.first_state = state_1_1
    workflow_1.save()

    workflow_2 = Workflow.objects.create(name='Complex Workflow')
    state_2_1 = State.objects.create(name=ugettext_noop('published'),
                                     workflow=workflow_2,
                                     allow_support=True,
                                     allow_submitter_edit=True,
                                     dont_set_identifier=True)
    state_2_2 = State.objects.create(name=ugettext_noop('permitted'),
                                     workflow=workflow_2,
                                     action_word='Permit',
                                     recommendation_label='Permission',
                                     allow_create_poll=True,
                                     allow_submitter_edit=True,
                                     versioning=True,
                                     leave_old_version_active=True)
    state_2_3 = State.objects.create(name=ugettext_noop('accepted'),
                                     workflow=workflow_2,
                                     action_word='Accept',
                                     recommendation_label='Acceptance',
                                     versioning=True,
                                     css_class='success')
    state_2_4 = State.objects.create(name=ugettext_noop('rejected'),
                                     workflow=workflow_2,
                                     action_word='Reject',
                                     recommendation_label='Rejection',
                                     versioning=True,
                                     css_class='danger')
    state_2_5 = State.objects.create(name=ugettext_noop('withdrawed'),
                                     workflow=workflow_2,
                                     action_word='Withdraw',
                                     versioning=True,
                                     css_class='default')
    state_2_6 = State.objects.create(name=ugettext_noop('adjourned'),
                                     workflow=workflow_2,
                                     action_word='Adjourn',
                                     recommendation_label='Adjournment',
                                     versioning=True,
                                     css_class='default')
    state_2_7 = State.objects.create(name=ugettext_noop('not concerned'),
                                     workflow=workflow_2,
                                     action_word='Do not concern',
                                     recommendation_label='No concernment',
                                     versioning=True,
                                     css_class='default')
    state_2_8 = State.objects.create(name=ugettext_noop('refered to committee'),
                                     workflow=workflow_2,
                                     action_word='Refer to committee',
                                     recommendation_label='Referral to committee',
                                     versioning=True,
                                     css_class='default')
    state_2_9 = State.objects.create(name=ugettext_noop('needs review'),
                                     workflow=workflow_2,
                                     action_word='Needs review',
                                     versioning=True,
                                     css_class='default')
    state_2_10 = State.objects.create(name=ugettext_noop('rejected (not authorized)'),
                                      workflow=workflow_2,
                                      action_word='Reject (not authorized)',
                                      recommendation_label='Rejection (not authorized)',
                                      versioning=True,
                                      css_class='default')
    state_2_1.next_states.add(state_2_2, state_2_5, state_2_10)
    state_2_2.next_states.add(state_2_3, state_2_4, state_2_5, state_2_6, state_2_7, state_2_8, state_2_9)
    workflow_2.first_state = state_2_1
    workflow_2.save()


def get_permission_change_data(sender, permissions, **kwargs):
    """
    Yields all necessary collections if 'motions.can_see' permission changes.
    """
    motions_app = apps.get_app_config(app_label='motions')
    for permission in permissions:
        # There could be only one 'motions.can_see' and then we want to return data.
        if permission.content_type.app_label == motions_app.label and permission.codename == 'can_see':
            yield from motions_app.get_startup_elements()
