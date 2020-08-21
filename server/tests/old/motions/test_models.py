from openslides.core.config import config
from openslides.motions.exceptions import WorkflowError
from openslides.motions.models import Motion, State, Workflow
from openslides.users.models import User
from tests.test_case import TestCase


class ModelTest(TestCase):
    def setUp(self):
        self.motion = Motion.objects.create(title="v1")
        self.test_user = User.objects.create(username="blub")
        # Use the simple workflow
        self.workflow = Workflow.objects.get(pk=1)

    def test_supporter(self):
        self.assertFalse(self.motion.is_supporter(self.test_user))
        self.motion.supporters.add(self.test_user)
        self.assertTrue(self.motion.is_supporter(self.test_user))
        self.motion.supporters.remove(self.test_user)
        self.assertFalse(self.motion.is_supporter(self.test_user))

    def test_state(self):
        self.motion.reset_state()
        self.assertEqual(self.motion.state.name, "submitted")

        self.motion.state = State.objects.get(pk=5)
        self.assertEqual(self.motion.state.name, "in progress")

        self.motion.state = State.objects.get(pk=6)
        self.assertEqual(self.motion.state.name, "submitted")

    def test_new_states_or_workflows(self):
        workflow_1 = Workflow.objects.create(name="W1")
        state_1 = State.objects.create(name="S1", workflow=workflow_1)
        workflow_1.first_state = state_1
        workflow_1.save()
        workflow_2 = Workflow.objects.create(name="W2")
        state_2 = State.objects.create(name="S2", workflow=workflow_2)
        workflow_2.first_state = state_2
        workflow_2.save()
        state_3 = State.objects.create(name="S3", workflow=workflow_1)

        with self.assertRaises(WorkflowError):
            workflow_2.first_state = state_3
            workflow_2.save()

        with self.assertRaises(WorkflowError):
            state_1.next_states.add(state_2)
            state_1.save()

    def test_two_empty_identifiers(self):
        Motion.objects.create(title="foo", text="bar", identifier="")
        Motion.objects.create(title="foo2", text="bar2", identifier="")

    def test_is_amendment(self):
        config["motions_amendments_enabled"] = True
        amendment = Motion.objects.create(title="amendment", parent=self.motion)

        self.assertTrue(amendment.is_amendment())
        self.assertFalse(self.motion.is_amendment())

    def test_set_identifier_allready_set(self):
        """
        If the motion already has a identifier, the method does nothing.
        """
        motion = Motion(identifier="My test identifier")

        motion.set_identifier()

        self.assertEqual(motion.identifier, "My test identifier")

    def test_set_identifier_manually(self):
        """
        If the config is set to manually, the method does nothing.
        """
        config["motions_identifier"] = "manually"
        motion = Motion()

        motion.set_identifier()

        # If the identifier should be set manually, the method does nothing
        self.assertIsNone(motion.identifier)

    def test_set_identifier_amendment(self):
        """
        If the motion is an amendment, the identifier is the identifier from the
        parent + a suffix.
        """
        config["motions_amendments_enabled"] = True
        config["motions_identifier_with_blank"] = False
        self.motion.identifier = "Parent identifier"
        self.motion.save()
        motion = Motion(parent=self.motion)

        motion.set_identifier()

        self.assertEqual(motion.identifier, "Parent identifier-1")

    def test_set_identifier_second_amendment(self):
        """
        If a motion has already an amendment, the second motion gets another
        identifier.
        """
        config["motions_amendments_enabled"] = True
        self.motion.identifier = "Parent identifier"
        self.motion.save()
        Motion.objects.create(title="Amendment1", parent=self.motion)
        motion = Motion(parent=self.motion)

        motion.set_identifier()

        self.assertEqual(motion.identifier, "Parent identifier-2")
