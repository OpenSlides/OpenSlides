from openslides.core.config import config
from openslides.motions.exceptions import WorkflowError
from openslides.motions.models import Motion, State, Workflow
from openslides.users.models import User
from openslides.utils.test import TestCase


class ModelTest(TestCase):
    def setUp(self):
        self.motion = Motion.objects.create(title='v1')
        self.test_user = User.objects.create(username='blub')
        # Use the simple workflow
        self.workflow = Workflow.objects.get(pk=1)

    def test_create_new_version(self):
        motion = self.motion
        self.assertEqual(motion.versions.count(), 1)

        # new data, but no new version
        motion.title = 'new title'
        motion.save()
        self.assertEqual(motion.versions.count(), 1)

        # new data and new version
        motion.text = 'new text'
        motion.save(use_version=motion.get_new_version())
        self.assertEqual(motion.versions.count(), 2)
        self.assertEqual(motion.title, 'new title')
        self.assertEqual(motion.text, 'new text')

    def test_version_data(self):
        motion = Motion()
        self.assertEqual(motion.title, '')
        with self.assertRaises(AttributeError):
            self._title

        motion.title = 'title'
        self.assertEqual(motion._title, 'title')

        motion.text = 'text'
        self.assertEqual(motion._text, 'text')

        motion.reason = 'reason'
        self.assertEqual(motion._reason, 'reason')

    def test_version(self):
        motion = self.motion

        motion.title = 'v2'
        motion.save(use_version=motion.get_new_version())
        motion.title = 'v3'
        motion.save(use_version=motion.get_new_version())
        with self.assertRaises(AttributeError):
            self._title
        self.assertEqual(motion.title, 'v3')

    def test_supporter(self):
        self.assertFalse(self.motion.is_supporter(self.test_user))
        self.motion.supporters.add(self.test_user)
        self.assertTrue(self.motion.is_supporter(self.test_user))
        self.motion.supporters.remove(self.test_user)
        self.assertFalse(self.motion.is_supporter(self.test_user))

    def test_state(self):
        self.motion.reset_state()
        self.assertEqual(self.motion.state.name, 'submitted')

        self.motion.state = State.objects.get(pk=5)
        self.assertEqual(self.motion.state.name, 'published')
        with self.assertRaises(WorkflowError):
            self.motion.create_poll()

        self.motion.state = State.objects.get(pk=6)
        self.assertEqual(self.motion.state.name, 'permitted')
        self.assertEqual(self.motion.state.get_action_word(), 'Permit')
        self.assertFalse(self.motion.get_allowed_actions(self.test_user)['support'])
        self.assertFalse(self.motion.get_allowed_actions(self.test_user)['unsupport'])

    def test_new_states_or_workflows(self):
        workflow_1 = Workflow.objects.create(name='W1')
        state_1 = State.objects.create(name='S1', workflow=workflow_1)
        workflow_1.first_state = state_1
        workflow_1.save()
        workflow_2 = Workflow.objects.create(name='W2')
        state_2 = State.objects.create(name='S2', workflow=workflow_2)
        workflow_2.first_state = state_2
        workflow_2.save()
        state_3 = State.objects.create(name='S3', workflow=workflow_1)

        with self.assertRaises(WorkflowError):
            workflow_2.first_state = state_3
            workflow_2.save()

        with self.assertRaises(WorkflowError):
            state_1.next_states.add(state_2)
            state_1.save()

    def test_two_empty_identifiers(self):
        Motion.objects.create(title='foo', text='bar', identifier='')
        Motion.objects.create(title='foo2', text='bar2', identifier='')

    def test_do_not_create_new_version_when_permit_old_version(self):
        motion = Motion()
        motion.title = 'foo'
        motion.text = 'bar'
        motion.save()
        first_version = motion.get_last_version()

        motion = Motion.objects.get(pk=motion.pk)
        motion.title = 'New Title'
        motion.save(use_version=motion.get_new_version())
        new_version = motion.get_last_version()
        self.assertEqual(motion.versions.count(), 2)

        motion.active_version = new_version
        motion.save()
        self.assertEqual(motion.versions.count(), 2)

        motion.active_version = first_version
        motion.save(use_version=False)
        self.assertEqual(motion.versions.count(), 2)

    def test_unicode_with_no_active_version(self):
        motion = Motion.objects.create(
            title='test_title_Koowoh1ISheemeey1air',
            text='test_text_zieFohph0doChi1Uiyoh',
            identifier='test_identifier_VohT1hu9uhiSh6ooVBFS')
        motion.active_version = None
        motion.save(update_fields=['active_version'])
        # motion.__unicode__() raised an AttributeError
        self.assertEqual(str(motion), 'test_title_Koowoh1ISheemeey1air')

    def test_is_amendment(self):
        config['motions_amendments_enabled'] = True
        amendment = Motion.objects.create(title='amendment', parent=self.motion)

        self.assertTrue(amendment.is_amendment())
        self.assertFalse(self.motion.is_amendment())

    def test_set_identifier_allready_set(self):
        """
        If the motion already has a identifier, the method does nothing.
        """
        motion = Motion(identifier='My test identifier')

        motion.set_identifier()

        self.assertEqual(motion.identifier, 'My test identifier')

    def test_set_identifier_manually(self):
        """
        If the config is set to manually, the method does nothing.
        """
        config['motions_identifier'] = 'manually'
        motion = Motion()

        motion.set_identifier()

        # If the identifier should be set manually, the method does nothing
        self.assertIsNone(motion.identifier)

    def test_set_identifier_amendment(self):
        """
        If the motion is an amendment, the identifier is the identifier from the
        parent + a suffix.
        """
        config['motions_amendments_enabled'] = True
        self.motion.identifier = 'Parent identifier'
        self.motion.save()
        motion = Motion(parent=self.motion)

        motion.set_identifier()

        self.assertEqual(motion.identifier, 'Parent identifier A 1')

    def test_set_identifier_second_amendment(self):
        """
        If a motion has already an amendment, the second motion gets another
        identifier.
        """
        config['motions_amendments_enabled'] = True
        self.motion.identifier = 'Parent identifier'
        self.motion.save()
        Motion.objects.create(title='Amendment1', parent=self.motion)
        motion = Motion(parent=self.motion)

        motion.set_identifier()

        self.assertEqual(motion.identifier, 'Parent identifier A 2')


class ConfigTest(TestCase):
    def test_stop_submitting(self):
        self.assertFalse(config['motions_stop_submitting'])
