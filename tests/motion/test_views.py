#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    Tests for openslides.motion.models
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.test.client import Client

from openslides.config.api import config
from openslides.utils.test import TestCase
from openslides.participant.models import User, Group
from openslides.motion.models import Motion, State


class MotionViewTestCase(TestCase):
    def setUp(self):
        # Admin
        self.admin = User.objects.create_superuser('admin', 'admin@admin.admin', 'admin')
        self.admin_client = Client()
        self.admin_client.login(username='admin', password='admin')

        # Staff
        self.staff = User.objects.create_user('staff', 'staff@user.user', 'staff')
        staff_group = Group.objects.get(name='Staff')
        self.staff.groups.add(staff_group)
        self.staff.save()
        self.staff_client = Client()
        self.staff_client.login(username='staff', password='staff')

        # Delegate
        self.delegate = User.objects.create_user('delegate', 'delegate@user.user', 'delegate')
        delegate_group = Group.objects.get(name='Delegates')
        self.delegate.groups.add(delegate_group)
        self.delegate.save()
        self.delegate_client = Client()
        self.delegate_client.login(username='delegate', password='delegate')

        # Registered
        self.registered = User.objects.create_user('registered', 'registered@user.user', 'registered')
        self.registered_client = Client()
        self.registered_client.login(username='registered', password='registered')

        self.motion1 = Motion.objects.create(title='motion1')
        self.motion2 = Motion.objects.create(title='motion2')

    def check_url(self, url, test_client, response_cose):
        response = test_client.get(url)
        self.assertEqual(response.status_code, response_cose)
        return response


class TestMotionListView(MotionViewTestCase):
    def test_get(self):
        self.check_url('/motion/', self.admin_client, 200)


class TestMotionDetailView(MotionViewTestCase):
    def test_get(self):
        self.check_url('/motion/1/', self.admin_client, 200)
        self.check_url('/motion/2/', self.admin_client, 200)
        self.check_url('/motion/500/', self.admin_client, 404)


class TestMotionDetailVersionView(MotionViewTestCase):
    def test_get(self):
        self.motion1.title = 'AFWEROBjwerGwer'
        self.motion1.save(use_version=self.motion1.get_new_version())
        self.check_url('/motion/1/version/1/', self.admin_client, 200)
        response = self.check_url('/motion/1/version/2/', self.admin_client, 200)
        self.assertContains(response, 'AFWEROBjwerGwer')
        self.check_url('/motion/1/version/500/', self.admin_client, 404)


class TestMotionCreateView(MotionViewTestCase):
    url = '/motion/new/'

    def test_get(self):
        self.check_url(self.url, self.admin_client, 200)

    def test_admin(self):
        response = self.admin_client.post(self.url, {'title': 'new motion',
                                                     'text': 'motion text',
                                                     'reason': 'motion reason',
                                                     'submitter': self.admin.person_id})
        self.assertEqual(response.status_code, 302)
        self.assertTrue(Motion.objects.filter(versions__title='new motion').exists())

    def test_delegate(self):
        response = self.delegate_client.post(self.url, {'title': 'delegate motion',
                                                        'text': 'motion text',
                                                        'reason': 'motion reason',
                                                        'submitter': self.admin.person_id})
        self.assertEqual(response.status_code, 302)
        motion = Motion.objects.get(versions__title='delegate motion')
        self.assertTrue(motion.is_submitter(self.delegate))

    def test_registered(self):
        response = self.registered_client.post(self.url, {'title': 'registered motion',
                                                          'text': 'motion text',
                                                          'reason': 'motion reason',
                                                          'submitter': self.admin.person_id})
        self.assertEqual(response.status_code, 403)
        self.assertFalse(Motion.objects.filter(versions__title='registered motion').exists())

    def test_delegate_after_stop_submitting_new_motions(self):
        config['motion_stop_submitting'] = True
        response = self.delegate_client.get(self.url)
        self.assertEqual(response.status_code, 403)

    def test_delegate_after_stop_submitting_new_motions_overview(self):
        config['motion_stop_submitting'] = True
        response = self.delegate_client.get('/motion/')
        self.assertNotContains(response, 'href="/motion/new/"', status_code=200)

    def test_staff_after_stop_submitting_new_motions(self):
        config['motion_stop_submitting'] = True
        response = self.staff_client.get(self.url)
        self.assertEqual(response.status_code, 200)

    def test_staff_after_stop_submitting_new_motions_overview(self):
        config['motion_stop_submitting'] = True
        response = self.staff_client.get('/motion/')
        self.assertContains(response, 'href="/motion/new/"', status_code=200)

    def test_identifier_not_unique(self):
        Motion.objects.create(title='Another motion 3', identifier='uufag5faoX0thahBi8Fo')
        config['motion_identifier'] = 'manually'
        response = self.admin_client.post(self.url, {'title': 'something',
                                                     'text': 'bar',
                                                     'submitter': self.admin.person_id,
                                                     'identifier': 'uufag5faoX0thahBi8Fo'})
        self.assertFormError(response, 'form', 'identifier', 'Motion with this Identifier already exists.')

    def test_empty_text_field(self):
        response = self.admin_client.post(self.url, {'title': 'foo',
                                                     'submitter': self.admin.person_id})
        self.assertFormError(response, 'form', 'text', 'This field is required.')


class TestMotionUpdateView(MotionViewTestCase):
    url = '/motion/1/edit/'

    def test_get(self):
        self.check_url(self.url, self.admin_client, 200)

    def test_admin(self):
        response = self.admin_client.post(self.url, {'title': 'new motion_title',
                                                     'text': 'motion text',
                                                     'reason': 'motion reason',
                                                     'submitter': self.admin.person_id})
        self.assertRedirects(response, '/motion/1/')
        motion = Motion.objects.get(pk=1)
        self.assertEqual(motion.title, 'new motion_title')

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
        self.assertRedirects(response, '/motion/1/')
        motion = Motion.objects.get(pk=1)
        self.assertEqual(motion.title, 'my title')

    def test_versioning(self):
        self.assertFalse(self.motion1.state.versioning)
        versioning_state = State.objects.create(name='automatic_versioning', workflow=self.motion1.state.workflow, versioning=True)
        self.motion1.state = versioning_state
        self.motion1.save()
        motion = Motion.objects.get(pk=self.motion1.pk)
        self.assertTrue(self.motion1.state.versioning)

        self.assertEqual(motion.versions.count(), 1)
        response = self.admin_client.post(self.url, {'title': 'another new motion_title',
                                                     'text': 'another motion text',
                                                     'reason': 'another motion reason',
                                                     'submitter': self.admin.person_id})
        self.assertRedirects(response, '/motion/1/')
        motion = Motion.objects.get(pk=self.motion1.pk)
        self.assertEqual(motion.versions.count(), 2)

    def test_disable_versioning(self):
        self.assertFalse(self.motion1.state.versioning)
        versioning_state = State.objects.create(name='automatic_versioning', workflow=self.motion1.state.workflow, versioning=True)
        self.motion1.state = versioning_state
        self.motion1.save()
        motion = Motion.objects.get(pk=self.motion1.pk)
        self.assertTrue(self.motion1.state.versioning)

        config['motion_allow_disable_versioning'] = True
        self.assertEqual(motion.versions.count(), 1)
        response = self.admin_client.post(self.url, {'title': 'another new motion_title',
                                                     'text': 'another motion text',
                                                     'reason': 'another motion reason',
                                                     'submitter': self.admin.person_id,
                                                     'disable_versioning': 'true'})
        self.assertRedirects(response, '/motion/1/')
        motion = Motion.objects.get(pk=self.motion1.pk)
        self.assertEqual(motion.versions.count(), 1)

    def test_no_versioning_without_new_data(self):
        self.assertFalse(self.motion1.state.versioning)
        versioning_state = State.objects.create(name='automatic_versioning', workflow=self.motion1.state.workflow, versioning=True)
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
                                                     'submitter': self.admin.person_id})
        self.assertRedirects(response, '/motion/1/')
        motion = Motion.objects.get(pk=self.motion1.pk)
        self.assertEqual(motion.versions.count(), 1)

    def test_set_another_workflow(self):
        self.assertEqual(self.motion1.state.workflow.pk, 1)
        response = self.admin_client.post(self.url, {'title': 'oori4KiaghaeSeuzaim2',
                                                     'text': 'eequei1Tee1aegeNgee0',
                                                     'submitter': self.admin.person_id})
        self.assertEqual(Motion.objects.get(pk=self.motion1.pk).state.workflow.pk, 1)
        response = self.admin_client.post(self.url, {'title': 'oori4KiaghaeSeuzaim2',
                                                     'text': 'eequei1Tee1aegeNgee0',
                                                     'submitter': self.admin.person_id,
                                                     'set_workflow': 2})
        self.assertRedirects(response, '/motion/1/')
        self.assertEqual(Motion.objects.get(pk=self.motion1.pk).state.workflow.pk, 2)

    def test_remove_supporters(self):
        # Setup a new motion with one supporter
        config['motion_min_supporters'] = 1
        motion = Motion.objects.create(title='cuoPhoX4Baifoxoothi3', text='zee7xei3taediR9loote')
        response = self.staff_client.get('/motion/%s/' % motion.id)
        self.assertNotContains(response, 'aengeing3quair3fieGi')
        motion.support(self.registered)
        self.registered.last_name = 'aengeing3quair3fieGi'
        self.registered.save()
        response = self.staff_client.get('/motion/%s/' % motion.id)
        self.assertContains(response, 'aengeing3quair3fieGi')

        # Check editing by submitter
        response = self.delegate_client.post(
            '/motion/%s/edit/' % motion.id,
            {'title': 'oori4KiaghaeSeuzaim2',
             'text': 'eequei1Tee1aegeNgee0',
             'submitter': self.delegate.person_id})
        self.assertEqual(response.status_code, 403)
        motion.add_submitter(self.delegate)

        # Edit three times, without removal of supporters, with removal and in another state
        for i in range(3):
            if i == 1:
                config['motion_remove_supporters'] = True
            response = self.delegate_client.post(
                '/motion/%s/edit/' % motion.id,
                {'title': 'iezae8reevaT6phiesoa',
                 'text': 'Lohjuu1aebewiu2or3oh'})
            self.assertRedirects(response, '/motion/%s/' % motion.id)
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


class TestMotionDeleteView(MotionViewTestCase):
    def test_get(self):
        response = self.check_url('/motion/2/del/', self.admin_client, 302)
        self.assertRedirects(response, '/motion/2/')

    def test_admin(self):
        response = self.admin_client.post('/motion/2/del/', {})
        self.assertRedirects(response, '/motion/')

    def test_delegate(self):
        response = self.delegate_client.post('/motion/2/del/', {})
        self.assertEqual(response.status_code, 403)
        motion = Motion.objects.get(pk=2).add_submitter(self.delegate)
        response = self.delegate_client.post('/motion/2/del/', {})
        self.assertEqual(response.status_code, 403)


class TestVersionPermitView(MotionViewTestCase):
    def setUp(self):
        super(TestVersionPermitView, self).setUp()
        self.motion1.title = 'new'
        self.motion1.save(use_version=self.motion1.get_new_version())

    def test_get(self):
        response = self.check_url('/motion/1/version/2/permit/', self.admin_client, 302)
        self.assertRedirects(response, '/motion/1/version/2/')

    def test_post(self):
        new_version = self.motion1.get_last_version()
        response = self.admin_client.post('/motion/1/version/2/permit/', {'yes': 1})
        self.assertRedirects(response, '/motion/1/version/2/')
        self.assertEqual(self.motion1.get_active_version(), new_version)

    def test_activate_old_version(self):
        new_version = self.motion1.get_last_version()
        first_version = self.motion1.versions.order_by('version_number')[0]

        self.motion1.active_version = new_version
        self.motion1.save()
        self.assertEqual(self.motion1.versions.count(), 2)
        response = self.admin_client.post('/motion/1/version/1/permit/', {'yes': 1})
        self.motion1 = Motion.objects.get(pk=1)
        self.assertEqual(self.motion1.active_version, first_version)
        self.assertEqual(self.motion1.versions.count(), 2)
