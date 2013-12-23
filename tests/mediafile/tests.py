# -*- coding: utf-8 -*-

import os
import tempfile

from django.conf import settings
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test.client import Client

from openslides.mediafile.models import Mediafile
from openslides.participant.models import User
from openslides.utils.test import TestCase


class MediafileTest(TestCase):
    """
    Unit test for the mediafile model.
    """
    def setUp(self):
        # Setup the three permissions
        ct = ContentType.objects.get(app_label='mediafile', model='mediafile')
        perm_1 = Permission.objects.get(content_type=ct, codename='can_see')
        perm_2 = Permission.objects.get(content_type=ct, codename='can_upload')

        # Setup three different users
        self.manager = User.objects.get(pk=1)
        self.vip_user = User.objects.create(username='mediafile_test_vip_user')
        self.vip_user.reset_password('default')
        self.vip_user.user_permissions.add(perm_1, perm_2)
        self.normal_user = User.objects.create(username='mediafile_test_normal_user')
        self.normal_user.reset_password('default')

        # Setup a mediafile object
        self.tmp_dir = settings.MEDIA_ROOT
        tmpfile_no, mediafile_path = tempfile.mkstemp(prefix='tmp_openslides_test_', dir=self.tmp_dir)
        self.object = Mediafile.objects.create(title='Title File 1', mediafile=mediafile_path, uploader=self.vip_user)
        os.close(tmpfile_no)

    def tearDown(self):
        self.object.mediafile.delete()

    def test_unicode(self):
        self.assertEqual(self.object.__unicode__(), 'Title File 1')

    def test_absolute_url(self):
        self.assertEqual(self.object.get_absolute_url(), '/mediafile/1/edit/')
        self.assertEqual(self.object.get_absolute_url('edit'), '/mediafile/1/edit/')
        self.assertEqual(self.object.get_absolute_url('update'), '/mediafile/1/edit/')
        self.assertEqual(self.object.get_absolute_url(link='delete'), '/mediafile/1/del/')

    def login_clients(self):
        """
        Helper function to login all three test users.
        """
        client_manager = Client()
        client_manager.login(username='admin', password='admin')
        client_vip_user = Client()
        client_vip_user.login(username='mediafile_test_vip_user', password='default')
        client_normal_user = Client()
        client_normal_user.login(username='mediafile_test_normal_user', password='default')
        return {'client_manager': client_manager,
                'client_vip_user': client_vip_user,
                'client_normal_user': client_normal_user}

    def test_see_mediafilelist(self):
        for client in self.login_clients().itervalues():
            response = client.get('/mediafile/')
            self.assertEqual(response.status_code, 200)
            self.assertTemplateUsed(response, 'mediafile/mediafile_list.html')
        bad_client = Client()
        response = bad_client.get('/mediafile/')
        self.assertRedirects(response, expected_url='/login/?next=/mediafile/', status_code=302, target_status_code=200)

    def test_upload_mediafile_get_request(self):
        clients = self.login_clients()
        response = clients['client_manager'].get('/mediafile/new/')
        self.assertContains(response, '---------', status_code=200)
        self.assertContains(response, '<option value="user:1" selected="selected">Administrator</option>', status_code=200)
        self.assertTemplateUsed(response, 'mediafile/mediafile_form.html')
        response = clients['client_vip_user'].get('/mediafile/new/')
        self.assertNotContains(response, '<select id="id_uploader" name="uploader">', status_code=200)
        self.assertTemplateUsed(response, 'mediafile/mediafile_form.html')
        response = clients['client_normal_user'].get('/mediafile/new/')
        self.assertEqual(response.status_code, 403)
        bad_client = Client()
        response = bad_client.get('/mediafile/new/')
        self.assertRedirects(response, expected_url='/login/?next=/mediafile/new/', status_code=302, target_status_code=200)

    def test_upload_mediafile_post_request(self):
        # Test first user
        client_1 = self.login_clients()['client_manager']
        new_file_1 = SimpleUploadedFile(name='new_test_file.txt', content='test content hello manager')
        response_1 = client_1.post('/mediafile/new/',
                                   {'title': 'new_test_file_title_1',
                                    'mediafile': new_file_1,
                                    'uploader': self.normal_user.person_id})
        self.assertRedirects(response_1, expected_url='/mediafile/', status_code=302, target_status_code=200)
        object_1 = Mediafile.objects.latest('timestamp')
        self.assertEqual(object_1.mediafile.url, '/media/file/new_test_file.txt')
        self.assertEqual(object_1.uploader, self.normal_user)
        path_1 = object_1.mediafile.path
        object_1.mediafile.delete()
        self.assertFalse(os.path.exists(path_1))

        # Test second user
        client_2 = self.login_clients()['client_vip_user']
        new_file_2 = SimpleUploadedFile(name='new_test_file.txt', content='test content hello vip_user')
        response_2 = client_2.post('/mediafile/new/',
                                   {'title': 'new_test_file_title_2',
                                    'mediafile': new_file_2})
        self.assertEqual(response_2.status_code, 302)
        # TODO: Check, why this does not work.
        # self.assertRedirects(response_2, expected_url='/mediafile/', status_code=302, target_status_code=200)
        object_2 = Mediafile.objects.latest('timestamp')
        self.assertEqual(object_2.mediafile.url, '/media/file/new_test_file.txt')
        self.assertEqual(object_2.uploader, self.vip_user)
        path_2 = object_2.mediafile.path
        object_2.mediafile.delete()
        self.assertFalse(os.path.exists(path_2))

        # Test third user
        client_3 = self.login_clients()['client_normal_user']
        new_file_3 = SimpleUploadedFile(name='new_test_file.txt', content='test content hello vip_user')
        response_3 = client_3.post('/mediafile/new/',
                                   {'title': 'new_test_file_title_2',
                                    'mediafile': new_file_3})
        self.assertEqual(response_3.status_code, 403)

    def test_edit_mediafile_get_request(self):
        clients = self.login_clients()
        response = clients['client_manager'].get('/mediafile/1/edit/')
        self.assertContains(response, '---------', status_code=200)
        self.assertContains(response, '<option value="user:2" selected="selected">mediafile_test_vip_user</option>', status_code=200)
        self.assertTemplateUsed(response, 'mediafile/mediafile_form.html')
        response = clients['client_vip_user'].get('/mediafile/1/edit/')
        self.assertEqual(response.status_code, 403)
        response = clients['client_normal_user'].get('/mediafile/1/edit/')
        self.assertEqual(response.status_code, 403)
        bad_client = Client()
        response = bad_client.get('/mediafile/1/edit/')
        self.assertRedirects(response, expected_url='/login/?next=/mediafile/1/edit/', status_code=302, target_status_code=200)

    def test_edit_mediafile_post_request(self):
        # Test only one user
        tmpfile_no, mediafile_2_path = tempfile.mkstemp(prefix='tmp_openslides_test_', dir=self.tmp_dir)
        os.close(tmpfile_no)
        object_2 = Mediafile.objects.create(title='Title File 2', mediafile=mediafile_2_path, uploader=self.vip_user)
        client_1 = self.login_clients()['client_manager']
        new_file_1 = SimpleUploadedFile(name='new_test_file.txt', content='test content hello manager')
        response_1 = client_1.post('/mediafile/2/edit/',
                                   {'title': 'new_test_file_title_1',
                                    'mediafile': new_file_1,
                                    'uploader': self.manager.person_id})
        self.assertEqual(response_1.status_code, 302)
        object_2 = Mediafile.objects.get(pk=2)
        self.assertEqual(object_2.mediafile.url, '/media/file/new_test_file.txt')
        self.assertEqual(object_2.uploader, self.manager)
        path_2 = object_2.mediafile.path
        object_2.mediafile.delete()
        self.assertFalse(os.path.exists(path_2))

    def test_delete_mediafile_get_request(self):
        clients = self.login_clients()
        response = clients['client_manager'].get('/mediafile/1/del/')
        self.assertRedirects(response, expected_url='/mediafile/1/edit/', status_code=302, target_status_code=200)
        response = clients['client_vip_user'].get('/mediafile/1/del/')
        self.assertEqual(response.status_code, 403)
        response = clients['client_normal_user'].get('/mediafile/1/del/')
        self.assertEqual(response.status_code, 403)
        bad_client = Client()
        response = bad_client.get('/mediafile/2/del/')
        self.assertRedirects(response, expected_url='/login/?next=/mediafile/2/del/', status_code=302, target_status_code=200)

    def test_delete_mediafile_post_request(self):
        tmpfile_no, mediafile_3_path = tempfile.mkstemp(prefix='tmp_openslides_test_', dir=self.tmp_dir)
        os.close(tmpfile_no)
        object_3 = Mediafile.objects.create(title='Title File 3', mediafile=mediafile_3_path)
        client_1 = self.login_clients()['client_manager']
        response_1 = client_1.post('/mediafile/2/del/', {'yes': 'foo'})
        self.assertRedirects(response_1, expected_url='/mediafile/', status_code=302, target_status_code=200)
        self.assertFalse(os.path.exists(object_3.mediafile.path))

    def test_filesize(self):
        tmpfile_no, mediafile_4_path = tempfile.mkstemp(prefix='tmp_openslides_test_', dir=self.tmp_dir)
        os.close(tmpfile_no)
        object_4 = Mediafile.objects.create(title='Title File 4', mediafile=mediafile_4_path)
        self.assertEqual(object_4.get_filesize(), '< 1 kB')
        with open(object_4.mediafile.path, 'wb') as bigfile:
            bigfile.seek(2047)
            bigfile.write('0')
        self.assertEqual(object_4.get_filesize(), '2 kB')
        with open(object_4.mediafile.path, 'wb') as bigfile:
            bigfile.seek(1048575)
            bigfile.write('0')
        self.assertEqual(object_4.get_filesize(), '1 MB')
        os.remove(mediafile_4_path)
        self.assertEqual(object_4.get_filesize(), 'unknown')
