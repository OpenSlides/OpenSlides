import os
import tempfile
from unittest import skip
from unittest.mock import MagicMock

from django.conf import settings
from django.test import RequestFactory
from django.test.client import Client

from openslides.config.api import config
from openslides.mediafiles.models import Mediafile
from openslides.motions import views
from openslides.motions.models import Category, Motion, MotionLog, State
from openslides.users.models import Group, User
from openslides.utils.test import TestCase


class MotionViewTestCase(TestCase):
    def setUp(self):
        # Admin
        self.admin = User.objects.get(pk=1)
        self.admin_client = Client()
        self.admin_client.login(username='admin', password='admin')

        # Staff
        self.staff = User.objects.create_user('staff', 'staff')
        staff_group = Group.objects.get(name='Staff')
        self.staff.groups.add(staff_group)
        self.staff.save()
        self.staff_client = Client()
        self.staff_client.login(username='staff', password='staff')

        # Delegate
        self.delegate = User.objects.create_user('delegate', 'delegate')
        delegate_group = Group.objects.get(name='Delegates')
        self.delegate.groups.add(delegate_group)
        self.delegate.save()
        self.delegate_client = Client()
        self.delegate_client.login(username='delegate', password='delegate')

        # Registered
        self.registered = User.objects.create_user('registered', 'registered')
        self.registered_client = Client()
        self.registered_client.login(username='registered', password='registered')

        self.motion1 = Motion.objects.create(title='motion1')
        self.motion2 = Motion.objects.create(title='motion2')

    def check_url(self, url, test_client, response_cose):
        response = test_client.get(url)
        self.assertEqual(response.status_code, response_cose)
        return response


class TestMotionListView(MotionViewTestCase):
    @skip
    def test_get(self):
        self.check_url('/motions/', self.admin_client, 200)

    @skip
    def test_get_with_motion(self):
        self.motion1.title = 'motion1_iozaixeeDuMah8sheGhe'
        self.motion1.save()
        response = self.admin_client.get('/motions/')
        self.assertContains(response, 'motion1_iozaixeeDuMah8sheGhe')

    @skip
    def test_get_with_filtered_motion_list(self):
        self.motion1.state.required_permission_to_see = 'motions.can_manage'
        self.motion1.state.save()
        self.motion1.title = 'motion1_djfplquczyxasvvgdnmbr'
        self.motion1.save()
        response = self.registered_client.get('/motions/')
        self.assertNotContains(response, 'motion1_djfplquczyxasvvgdnmbr')


class TestMotionDetailView(MotionViewTestCase):
    @skip
    def test_get(self):
        self.check_url('/motions/1/', self.admin_client, 200)
        self.check_url('/motions/2/', self.admin_client, 200)
        self.check_url('/motions/500/', self.admin_client, 404)

    @skip
    def test_attachment(self):
        # Preparation
        tmpfile_no, attachment_path = tempfile.mkstemp(prefix='tmp_openslides_test_', dir=settings.MEDIA_ROOT)
        os.close(tmpfile_no)
        attachment = Mediafile.objects.create(title='TestFile_Neiri4xai4ueseGohzid', mediafile=attachment_path)
        self.motion1.attachments.add(attachment)

        # Test appearance
        response = self.registered_client.get('/motions/1/')
        self.assertContains(response, '<h4>Attachments:</h4>')
        self.assertContains(response, 'TestFile_Neiri4xai4ueseGohzid')

        # Test disappearance
        attachment.mediafile.delete()
        attachment.delete()
        response = self.registered_client.get('/motions/1/')
        self.assertNotContains(response, '<h4>Attachments:</h4>')
        self.assertNotContains(response, 'TestFile_Neiri4xai4ueseGohzid')

    @skip
    def test_poll(self):
        response = self.staff_client.get('/motions/1/create_poll/')
        self.assertRedirects(response, '/motions/1/poll/1/edit/')
        response = self.staff_client.post(
            '/motions/1/poll/1/edit/',
            {'option-1-Yes': '10',
             'pollform-votesvalid': '50'})
        self.assertRedirects(response, '/motions/1/')
        response = self.staff_client.get('/motions/1/')
        self.assertContains(response, '50 (100')

    @skip
    def test_deleted_supporter(self):
        config['motion_min_supporters'] = 1
        self.motion1.support(self.registered)
        self.assertContains(self.admin_client.get('/motions/1/'), 'registered')
        self.registered.delete()
        self.assertNotContains(self.admin_client.get('/motions/1/'), 'registered')

    @skip
    def test_get_without_required_permission_from_state(self):
        self.motion1.state.required_permission_to_see = 'motions.can_manage'
        self.motion1.state.save()
        self.check_url('/motions/1/', self.admin_client, 200)
        self.check_url('/motions/1/', self.registered_client, 403)
        self.motion1.set_state(state=State.objects.get(name='permitted'))
        self.motion1.save()
        self.check_url('/motions/1/', self.registered_client, 200)

    @skip
    def test_get_without_required_permission_from_state_but_by_submitter(self):
        self.motion1.state.required_permission_to_see = 'motions.can_manage'
        self.motion1.state.save()
        self.motion1.add_submitter(self.registered)
        self.check_url('/motions/1/', self.registered_client, 200)


class TestMotionDetailVersionView(MotionViewTestCase):
    @skip
    def test_get(self):
        self.motion1.title = 'AFWEROBjwerGwer'
        self.motion1.save(use_version=self.motion1.get_new_version())
        self.check_url('/motions/1/version/1/', self.admin_client, 200)
        response = self.check_url('/motions/1/version/2/', self.admin_client, 200)
        self.assertContains(response, 'AFWEROBjwerGwer')
        self.check_url('/motions/1/version/500/', self.admin_client, 404)


class TestMotionVersionDiffView(MotionViewTestCase):
    @skip
    def test_get_without_required_permission_from_state(self):
        self.motion1.reason = 'reason1_bnmkjiutufjbnvcde334'
        self.motion1.save()
        self.motion1.title = 'motion1_bnvhfzqsgxcyvasfr57t'
        self.motion1.save(use_version=self.motion1.get_new_version())

        response = self.registered_client.get(
            '/motions/1/diff/',
            {'rev1': '1', 'rev2': '2'})
        self.assertNotContains(response, 'At least one version number is not valid.')
        self.assertEqual(response.status_code, 200)

        self.motion1.state.required_permission_to_see = 'motions.can_manage'
        self.motion1.state.save()

        response = self.registered_client.get(
            '/motions/1/diff/',
            {'rev1': '1', 'rev2': '2'})
        self.assertEqual(response.status_code, 403)


class TestMotionCreateView(MotionViewTestCase):
    url = '/motions/new/'

    @skip
    def test_get(self):
        self.check_url(self.url, self.admin_client, 200)

    @skip
    def test_admin(self):
        response = self.admin_client.post(self.url, {'title': 'new motion',
                                                     'text': 'motion text',
                                                     'reason': 'motion reason',
                                                     'workflow': '1'})
        self.assertEqual(response.status_code, 302)
        self.assertTrue(Motion.objects.filter(versions__title='new motion').exists())

    @skip
    def test_delegate(self):
        response = self.delegate_client.post(self.url, {'title': 'delegate motion',
                                                        'text': 'motion text',
                                                        'reason': 'motion reason',
                                                        'submitter': self.admin.id})
        self.assertEqual(response.status_code, 302)
        motion = Motion.objects.get(versions__title='delegate motion')
        self.assertTrue(motion.is_submitter(self.delegate))

    @skip
    def test_registered(self):
        response = self.registered_client.post(self.url, {'title': 'registered motion',
                                                          'text': 'motion text',
                                                          'reason': 'motion reason',
                                                          'submitter': self.admin.id})
        self.assertEqual(response.status_code, 403)
        self.assertFalse(Motion.objects.filter(versions__title='registered motion').exists())

    @skip
    def test_delegate_after_stop_submitting_new_motions(self):
        config['motion_stop_submitting'] = True
        response = self.delegate_client.get(self.url)
        self.assertEqual(response.status_code, 403)

    @skip
    def test_delegate_after_stop_submitting_new_motions_overview(self):
        config['motion_stop_submitting'] = True
        response = self.delegate_client.get('/motions/')
        self.assertNotContains(response, 'href="/motions/new/"', status_code=200)

    @skip
    def test_staff_after_stop_submitting_new_motions(self):
        config['motion_stop_submitting'] = True
        response = self.staff_client.get(self.url)
        self.assertEqual(response.status_code, 200)

    @skip
    def test_staff_after_stop_submitting_new_motions_overview(self):
        config['motion_stop_submitting'] = True
        response = self.staff_client.get('/motions/')
        self.assertContains(response, 'href="/motions/new/"', status_code=200)

    @skip
    def test_identifier_not_unique(self):
        Motion.objects.create(title='Another motion 3', identifier='uufag5faoX0thahBi8Fo')
        config['motion_identifier'] = 'manually'
        response = self.admin_client.post(self.url, {'title': 'something',
                                                     'text': 'bar',
                                                     'submitter': self.admin.id,
                                                     'identifier': 'uufag5faoX0thahBi8Fo'})
        self.assertFormError(response, 'form', 'identifier', 'Motion with this Identifier already exists.')

    @skip
    def test_empty_text_field(self):
        response = self.admin_client.post(self.url, {'title': 'foo',
                                                     'submitter': self.admin.id})
        self.assertFormError(response, 'form', 'text', 'This field is required.')

    @skip
    def test_identifier_with_category_prefix(self):
        category = Category.objects.create(name='category_oosozieh9eBa9aegujee', prefix='prefix_raiLie6keik6Eikeiphi')
        response = self.admin_client.post(self.url, {'title': 'motion io2iez3Iwoh3aengi5hu',
                                                     'text': 'motion text thoiveshoongoNg7ceek',
                                                     'category': 1,
                                                     'workflow': 1})
        self.assertEqual(response.status_code, 302)
        motion = Motion.objects.filter(category=category).get()
        self.assertEqual(motion.identifier, 'prefix_raiLie6keik6Eikeiphi 1')

    @skip
    def test_log(self):
        self.assertFalse(MotionLog.objects.all().exists())
        self.admin_client.post(self.url, {'title': 'new motion',
                                          'text': 'motion text',
                                          'workflow': 1})
        self.assertEqual(MotionLog.objects.get(pk=1).message_list, ['Motion created'])


class TestMotionCreateAmendmentView(MotionViewTestCase):
    url = '/motions/1/new_amendment/'

    @skip
    def test_get_amendment_active(self):
        config['motion_amendments_enabled'] = True
        self.check_url(self.url, self.admin_client, 200)

    @skip
    def test_get_amendment_inactive(self):
        config['motion_amendments_enabled'] = False
        self.check_url(self.url, self.admin_client, 404)

    @skip
    def test_get_parent_motion(self):
        motion = Motion.objects.create(title='Test Motion')
        view = views.MotionCreateAmendmentView()
        view.request = RequestFactory().get(self.url)
        view.kwargs = {'pk': motion.pk}

        self.assertEqual(view.get_parent_motion(), motion)

    @skip
    def test_manipulate_object(self):
        motion = Motion.objects.create(title='Test Motion')
        view = views.MotionCreateAmendmentView()
        view.request = RequestFactory().get(self.url)
        view.kwargs = {'pk': motion.pk}
        view.object = MagicMock()

        view.manipulate_object(MagicMock())

        self.assertEqual(view.object.parent, motion)

    @skip
    def test_get_initial(self):
        motion = Motion.objects.create(
            title='Test Motion', text='Parent Motion text', reason='test reason')
        view = views.MotionCreateAmendmentView()
        view.request = MagicMock()
        view.kwargs = {'pk': motion.pk}

        self.assertEqual(view.get_initial(), {
            'reason': u'test reason',
            'text': u'Parent Motion text',
            'title': u'Test Motion',
            'category': None,
            'workflow': '1'})

    @skip
    def test_get_initial_with_category(self):
        category = Category.objects.create(name='test category')
        motion = Motion.objects.create(
            title='Test Motion', text='Parent Motion text', reason='test reason',
            category=category)
        view = views.MotionCreateAmendmentView()
        view.request = MagicMock()
        view.kwargs = {'pk': motion.pk}

        self.assertEqual(view.get_initial(), {
            'reason': u'test reason',
            'text': u'Parent Motion text',
            'title': u'Test Motion',
            'category': category,
            'workflow': '1'})


class TestMotionUpdateView(MotionViewTestCase):
    url = '/motions/1/edit/'

    @skip
    def test_get(self):
        self.check_url(self.url, self.admin_client, 200)

    @skip
    def test_admin(self):
        response = self.admin_client.post(self.url, {'title': 'new motion_title',
                                                     'text': 'motion text',
                                                     'reason': 'motion reason',
                                                     'submitter': self.admin.id,
                                                     'workflow': 1})
        self.assertRedirects(response, '/motions/1/')
        motion = Motion.objects.get(pk=1)
        self.assertEqual(motion.title, 'new motion_title')

    @skip
    def test_delegate(self):
        response = self.delegate_client.post(self.url, {'title': 'my title',
                                                        'text': 'motion text',
                                                        'reason': 'motion reason'})
        self.assertEqual(response.status_code, 403)
        motion = Motion.objects.get(pk=1)
        motion.add_submitter(self.delegate)
        response = self.delegate_client.post(self.url, {'title': 'my title',
                                                        'text': 'motion text',
                                                        'reason': 'motion reason'})
        self.assertRedirects(response, '/motions/1/')
        motion = Motion.objects.get(pk=1)
        self.assertEqual(motion.title, 'my title')

    @skip
    def test_versioning(self):
        self.assertFalse(self.motion1.state.versioning)
        workflow = self.motion1.state.workflow
        versioning_state = State.objects.create(name='automatic_versioning', workflow=workflow, versioning=True)
        self.motion1.state = versioning_state
        self.motion1.save()
        motion = Motion.objects.get(pk=self.motion1.pk)
        self.assertTrue(self.motion1.state.versioning)

        self.assertEqual(motion.versions.count(), 1)
        response = self.admin_client.post(self.url, {'title': 'another new motion_title',
                                                     'text': 'another motion text',
                                                     'reason': 'another motion reason',
                                                     'workflow': workflow.pk,
                                                     'submitter': self.admin.id})
        self.assertRedirects(response, '/motions/1/')
        motion = Motion.objects.get(pk=self.motion1.pk)
        self.assertEqual(motion.versions.count(), 2)

    @skip
    def test_disable_versioning(self):
        self.assertFalse(self.motion1.state.versioning)
        workflow = self.motion1.state.workflow
        versioning_state = State.objects.create(name='automatic_versioning', workflow=workflow, versioning=True)
        self.motion1.state = versioning_state
        self.motion1.save()
        motion = Motion.objects.get(pk=self.motion1.pk)
        self.assertTrue(self.motion1.state.versioning)

        config['motion_allow_disable_versioning'] = True
        self.assertEqual(motion.versions.count(), 1)
        response = self.admin_client.post(self.url, {'title': 'another new motion_title',
                                                     'text': 'another motion text',
                                                     'reason': 'another motion reason',
                                                     'submitter': self.admin.id,
                                                     'workflow': workflow.pk,
                                                     'disable_versioning': 'true'})
        self.assertRedirects(response, '/motions/1/')
        motion = Motion.objects.get(pk=self.motion1.pk)
        self.assertEqual(motion.versions.count(), 1)

    @skip
    def test_no_versioning_without_new_data(self):
        self.assertFalse(self.motion1.state.versioning)
        workflow = self.motion1.state.workflow
        versioning_state = State.objects.create(name='automatic_versioning', workflow=workflow, versioning=True)
        self.motion1.state = versioning_state
        self.motion1.title = 'Chah4kaaKasiVuishi5x'
        self.motion1.text = 'eedieFoothae2iethuo3'
        self.motion1.reason = 'ier2laiy1veeGoo0mau2'
        self.motion1.save()
        motion = Motion.objects.get(pk=self.motion1.pk)
        self.assertTrue(self.motion1.state.versioning)

        self.assertEqual(motion.versions.count(), 1)
        response = self.admin_client.post(self.url, {'title': 'Chah4kaaKasiVuishi5x',
                                                     'text': 'eedieFoothae2iethuo3',
                                                     'reason': 'ier2laiy1veeGoo0mau2',
                                                     'workflow': workflow.pk,
                                                     'submitter': self.admin.id})
        self.assertRedirects(response, '/motions/1/')
        motion = Motion.objects.get(pk=self.motion1.pk)
        self.assertEqual(motion.versions.count(), 1)

    @skip
    def test_set_another_workflow(self):
        self.assertEqual(self.motion1.state.workflow.pk, 1)
        response = self.admin_client.post(self.url, {'title': 'oori4KiaghaeSeuzaim2',
                                                     'text': 'eequei1Tee1aegeNgee0',
                                                     'submitter': self.admin.id})
        self.assertEqual(Motion.objects.get(pk=self.motion1.pk).state.workflow.pk, 1)
        response = self.admin_client.post(self.url, {'title': 'oori4KiaghaeSeuzaim2',
                                                     'text': 'eequei1Tee1aegeNgee0',
                                                     'submitter': self.admin.id,
                                                     'workflow': 2})
        self.assertRedirects(response, '/motions/1/')
        self.assertEqual(Motion.objects.get(pk=self.motion1.pk).state.workflow.pk, 2)

    @skip
    def test_remove_supporters(self):
        # Setup a new motion with one supporter
        config['motion_min_supporters'] = 1
        motion = Motion.objects.create(title='cuoPhoX4Baifoxoothi3', text='zee7xei3taediR9loote')
        response = self.staff_client.get('/motions/%s/' % motion.id)
        self.assertNotContains(response, 'aengeing3quair3fieGi')

        motion.support(self.registered)
        self.registered.last_name = 'aengeing3quair3fieGi'
        self.registered.save()
        response = self.staff_client.get('/motions/%s/' % motion.id)
        self.assertContains(response, 'aengeing3quair3fieGi')

        # Check editing by submitter
        response = self.delegate_client.post(
            '/motions/%s/edit/' % motion.id,
            {'title': 'oori4KiaghaeSeuzaim2',
             'text': 'eequei1Tee1aegeNgee0',
             'submitter': self.delegate.id})
        self.assertEqual(response.status_code, 403)
        motion.add_submitter(self.delegate)

        # Edit three times, without removal of supporters, with removal and in another state
        for i in range(3):
            if i == 1:
                config['motion_remove_supporters'] = True
            response = self.delegate_client.post(
                '/motions/%s/edit/' % motion.id,
                {'title': 'iezae8reevaT6phiesoa',
                 'text': 'Lohjuu1aebewiu2or3oh'})
            self.assertRedirects(response, '/motions/%s/' % motion.id)
            if i == 0 or i == 2:
                self.assertTrue(self.registered in Motion.objects.get(pk=motion.pk).supporters)
            else:
                self.assertFalse(self.registered in Motion.objects.get(pk=motion.pk).supporters)
                # Preparing the comming (third) run
                motion = Motion.objects.get(pk=motion.pk)
                motion.support(self.registered)
                motion.state = State.objects.create(
                    name='not_support',
                    workflow=self.motion1.state.workflow,
                    allow_submitter_edit=True,
                    allow_support=False)
                motion.save()

    @skip
    def test_form_version_content(self):
        """
        The content seen in the update view should be the last version
        independently from the active_version.
        """
        motion = Motion.objects.create(title='test', text='wrowerjlgw')
        new_version = motion.get_new_version()
        new_version.text = 'tpdfgojwerldkfgertdfg'
        motion.save(use_version=new_version)
        motion.active_version = motion.versions.all()[0]
        motion.save(use_version=False)
        self.assertNotEqual(motion.active_version, motion.get_last_version())

        response = self.admin_client.get('/motions/%s/edit/' % motion.id)
        self.assertEqual(response.context['form'].initial['text'], 'tpdfgojwerldkfgertdfg')

    @skip
    def test_log(self):
        self.assertFalse(MotionLog.objects.all().exists())

        # Update motion without versioning
        self.assertFalse(self.motion1.state.versioning)
        self.admin_client.post(self.url, {'title': 'new motion_title',
                                          'text': 'motion text',
                                          'workflow': 2})
        self.assertEqual(MotionLog.objects.get(pk=1).message_list, ['Motion version', ' 1 ', 'updated'])

        # Update motion by creating a new version
        self.motion1.set_state(6)  # Set to state 'permitted' which has versioning=True
        self.assertTrue(self.motion1.state.versioning)
        self.motion1.save(use_version=False)
        self.admin_client.post(self.url, {'title': 'new motion_title',
                                          'text': 'new motion text',
                                          'workflow': 2})
        self.assertEqual(MotionLog.objects.get(pk=2).message_list, ['Motion version', ' 2 ', 'created'])

        # Update motion with so called 'trivial changes'
        config['motion_allow_disable_versioning'] = True
        self.admin_client.post(self.url, {'title': 'new motion_title',
                                          'text': 'more new motion text',
                                          'disable_versioning': 'on',
                                          'workflow': 2})
        self.assertEqual(MotionLog.objects.get(pk=3).message_list, ['Motion version', ' 2 ', 'updated'])

        # Update motion without changes in the version data
        self.admin_client.post(self.url, {'title': 'new motion_title',
                                          'text': 'more new motion text',
                                          'workflow': 2})
        self.assertEqual(MotionLog.objects.get(pk=4).message_list, ['Motion version', ' 2 ', 'updated'])

        # Update motion without changes in the version data but also with the 'trivial changes' flag
        self.admin_client.post(self.url, {'title': 'new motion_title',
                                          'text': 'more new motion text',
                                          'disable_versioning': 'on',
                                          'workflow': 2})
        self.assertEqual(MotionLog.objects.get(pk=5).message_list, ['Motion version', ' 2 ', 'updated'])

    @skip
    def test_attachment_initial(self):
        attachment = Mediafile.objects.create(title='test_title_iech1maatahShiecohca')
        self.motion1.attachments.add(attachment)
        response = self.admin_client.get(self.url)
        self.assertContains(response, '<option value="1" selected="selected">%s</option>' % attachment.title)
        self.motion1.attachments.clear()
        response = self.admin_client.get(self.url)
        self.assertNotContains(response, '<option value="1" selected="selected">%s</option>' % attachment.title)


class TestMotionDeleteView(MotionViewTestCase):
    @skip
    def test_get(self):
        response = self.check_url('/motions/2/del/', self.admin_client, 302)
        self.assertRedirects(response, '/motions/2/')

    @skip
    def test_admin(self):
        response = self.admin_client.post('/motions/2/del/', {'yes': 'yes'})
        self.assertRedirects(response, '/motions/')

    @skip
    def test_delegate(self):
        response = self.delegate_client.post('/motions/2/del/', {'yes': 'yes'})
        self.assertEqual(response.status_code, 403)
        Motion.objects.get(pk=2).add_submitter(self.delegate)
        response = self.delegate_client.post('/motions/2/del/', {'yes': 'yes'})
        self.assertEqual(response.status_code, 403)


class TestVersionPermitView(MotionViewTestCase):
    def setUp(self):
        super(TestVersionPermitView, self).setUp()
        self.motion1.title = 'new'
        self.motion1.save(use_version=self.motion1.get_new_version())

    @skip
    def test_get(self):
        response = self.check_url('/motions/1/version/2/permit/', self.admin_client, 302)
        self.assertRedirects(response, '/motions/1/version/2/')

    @skip
    def test_post(self):
        new_version = self.motion1.get_last_version()
        response = self.admin_client.post('/motions/1/version/2/permit/', {'yes': 1})
        self.assertRedirects(response, '/motions/1/')
        self.assertEqual(self.motion1.get_active_version(), new_version)

    @skip
    def test_activate_old_version(self):
        new_version = self.motion1.get_last_version()
        first_version = self.motion1.versions.order_by('version_number')[0]

        self.motion1.active_version = new_version
        self.motion1.save()
        self.assertEqual(self.motion1.versions.count(), 2)
        self.admin_client.post('/motions/1/version/1/permit/', {'yes': 1})
        self.motion1 = Motion.objects.get(pk=1)
        self.assertEqual(self.motion1.active_version, first_version)
        self.assertEqual(self.motion1.versions.count(), 2)


class TestVersionDeleteView(MotionViewTestCase):
    @skip
    def test_get(self):
        self.motion1.save(use_version=self.motion1.get_new_version(title='new', text='new'))
        response = self.check_url('/motions/1/version/1/del/', self.admin_client, 302)
        self.assertRedirects(response, '/motions/1/version/1/')

    @skip
    def test_post(self):
        new_version = self.motion1.get_new_version
        self.motion1.save(use_version=new_version(title='new', text='new'))
        self.motion1.save(use_version=new_version(title='new2', text='new'))
        self.assertEqual(self.motion1.versions.count(), 3)

        response = self.admin_client.post('/motions/1/version/2/del/', {'yes': 1})
        self.assertRedirects(response, '/motions/1/')
        self.assertEqual(self.motion1.versions.count(), 2)

    @skip
    def test_delete_active_version(self):
        self.motion1.save(use_version=self.motion1.get_new_version(title='new_title_yae6Aequaiw5saeb8suG', text='new'))
        motion = Motion.objects.all()[0]
        self.assertEqual(motion.get_active_version().title, 'new_title_yae6Aequaiw5saeb8suG')
        response = self.admin_client.post('/motions/1/version/2/del/', {'yes': 1})
        self.assertEqual(response.status_code, 404)


class MotionSetStatusView(MotionViewTestCase):
    @skip
    def test_set_status(self):
        self.assertEqual(self.motion1.state, State.objects.get(name='submitted'))
        self.check_url('/motions/1/set_state/4/', self.registered_client, 403)
        response = self.staff_client.get('/motions/1/set_state/4/')
        self.assertRedirects(response, '/motions/1/')
        self.assertEqual(Motion.objects.get(pk=1).state, State.objects.get(name='not decided'))
        response = self.staff_client.get('/motions/1/set_state/1/')
        self.assertTrue('You can not set the state of the motion to submitted.' in response.cookies['messages'].value)
        self.assertRedirects(response, '/motions/1/')
        response = self.staff_client.get('/motions/1/set_state/4/')
        self.assertTrue('You can not set the state of the motion. It is already done.' in response.cookies['messages'].value)
        self.assertRedirects(response, '/motions/1/')


class CategoryViewsTest(TestCase):
    def setUp(self):
        self.admin_client = Client()
        self.admin_client.login(username='admin', password='admin')

    @skip
    def test_create(self):
        url = '/motions/category/new/'
        response = self.admin_client.get(url)
        self.assertTemplateUsed(response, 'motions/category_form.html')
        response = self.admin_client.post(url, {'name': 'test_title_eingee0hiveeZ6coohoo'})
        self.assertRedirects(response, '/motions/category/')
        self.assertTrue(Category.objects.filter(name='test_title_eingee0hiveeZ6coohoo').exists())

    @skip
    def test_update(self):
        # Setup
        url = '/motions/category/1/edit/'
        Category.objects.create(name='test_title_chu6zu3deithae1gooL1')
        # Test
        response = self.admin_client.get(url)
        self.assertTemplateUsed(response, 'motions/category_form.html')
        self.assertContains(response, 'test_title_chu6zu3deithae1gooL1')
        response = self.admin_client.post(url, {'name': 'test_title_jaiShae1sheingahlee2'})
        self.assertRedirects(response, '/motions/category/')
        self.assertEqual(Category.objects.get(pk=1).name, 'test_title_jaiShae1sheingahlee2')

    @skip
    def test_delete(self):
        # Setup
        url = '/motions/category/1/del/'
        Category.objects.create(name='test_title_nei1wooHes2aiquuraep')
        # Test
        response = self.admin_client.get(url)
        self.assertRedirects(response, '/motions/category/')
        response = self.admin_client.post(url, {'yes': 'true'})
        self.assertRedirects(response, '/motions/category/')
        self.assertFalse(Category.objects.exists())


class PollUpdateViewTest(TestCase):
    def setUp(self):
        self.admin_client = Client()
        self.admin_client.login(username='admin', password='admin')

    @skip
    def test_not_existing_poll(self):
        """
        Tests that a 404 is returned, when a non existing poll is requested
        """
        Motion.objects.create(title='test_motion')
        url = '/motions/1/poll/1/edit/'

        response = self.admin_client.get(url)

        self.assertTrue(response.status_code, '404')
