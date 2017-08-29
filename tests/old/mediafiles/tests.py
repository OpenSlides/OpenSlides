import os
import tempfile
from unittest import skip

from django.conf import settings
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test.client import Client

from openslides.mediafiles.models import Mediafile
from openslides.users.models import User
from openslides.utils.test import TestCase


class MediafileTest(TestCase):
    """
    Unit test for the mediafile model.
    """
    def setUp(self):
        # Setup the three permissions
        ct = ContentType.objects.get(app_label='mediafiles', model='mediafile')
        perm_1 = Permission.objects.get(content_type=ct, codename='can_see')
        perm_2 = Permission.objects.get(content_type=ct, codename='can_upload')

        # Setup three different users
        self.manager = User.objects.get(pk=1)
        self.vip_user = User.objects.create_user('mediafile_test_vip_user', 'default')
        self.vip_user.user_permissions.add(perm_1, perm_2)
        self.normal_user = User.objects.create_user('mediafile_test_normal_user', 'default')

        # Setup a mediafile object
        self.tmp_dir = settings.MEDIA_ROOT
        tmpfile_no, mediafile_path = tempfile.mkstemp(prefix='tmp_openslides_test_', dir=self.tmp_dir)
        self.object = Mediafile.objects.create(title='Title File 1', mediafile=mediafile_path, uploader=self.normal_user)
        os.close(tmpfile_no)

    def tearDown(self):
        self.object.mediafile.delete(save=False)
        super().tearDown()

    def test_str(self):
        self.assertEqual(str(self.object), 'Title File 1')

    @skip
    def test_absolute_url(self):
        self.assertEqual(self.object.get_absolute_url(), '/mediafiles/1/edit/')
        self.assertEqual(self.object.get_absolute_url('update'), '/mediafiles/1/edit/')
        self.assertEqual(self.object.get_absolute_url(link='delete'), '/mediafiles/1/del/')

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

    @skip
    def test_see_mediafilelist(self):
        for client in self.login_clients().values():
            response = client.get('/mediafiles/')
            self.assertEqual(response.status_code, 200)
            self.assertTemplateUsed(response, 'mediafiles/mediafile_list.html')

    @skip
    def test_upload_mediafile_get_request(self):
        clients = self.login_clients()
        response = clients['client_manager'].get('/mediafiles/new/')
        self.assertContains(response, '---------', status_code=200)
        self.assertContains(response, '<option value="1" selected="selected">Administrator</option>', status_code=200)
        self.assertTemplateUsed(response, 'mediafiles/mediafile_form.html')

        response = clients['client_vip_user'].get('/mediafiles/new/')
        self.assertNotContains(response, '<select id="id_uploader" name="uploader">', status_code=200)
        self.assertTemplateUsed(response, 'mediafiles/mediafile_form.html')

        response = clients['client_normal_user'].get('/mediafiles/new/')
        self.assertEqual(response.status_code, 403)

    @skip
    def test_upload_mediafile_post_request(self):
        # Test first user
        client_1 = self.login_clients()['client_manager']
        new_file_1 = SimpleUploadedFile(name='new_test_file.txt', content=bytes('test content hello manager', 'UTF-8'))
        response_1 = client_1.post('/mediafiles/new/',
                                   {'title': 'new_test_file_title_1',
                                    'mediafile': new_file_1,
                                    'uploader': self.normal_user.pk})
        self.assertRedirects(response_1, expected_url='/mediafiles/', status_code=302, target_status_code=200)
        object_1 = Mediafile.objects.latest('timestamp')
        self.assertEqual(object_1.mediafile.url, '/media/file/new_test_file.txt')
        self.assertEqual(object_1.uploader, self.normal_user)
        path_1 = object_1.mediafile.path
        object_1.mediafile.delete()
        self.assertFalse(os.path.exists(path_1))

        # Test second user
        client_2 = self.login_clients()['client_vip_user']
        new_file_2 = SimpleUploadedFile(name='new_test_file.txt', content=bytes('test content hello vip_user', 'UTF-8'))
        response_2 = client_2.post('/mediafiles/new/',
                                   {'title': 'new_test_file_title_2',
                                    'mediafile': new_file_2})
        self.assertEqual(response_2.status_code, 302)
        # TODO: Check, why this does not work.
        # self.assertRedirects(response_2, expected_url='/mediafiles/', status_code=302, target_status_code=200)
        object_2 = Mediafile.objects.latest('timestamp')
        self.assertEqual(object_2.mediafile.url, '/media/file/new_test_file.txt')
        self.assertEqual(object_2.uploader, self.vip_user)
        path_2 = object_2.mediafile.path
        object_2.mediafile.delete()
        self.assertFalse(os.path.exists(path_2))

        # Test third user
        client_3 = self.login_clients()['client_normal_user']
        new_file_3 = SimpleUploadedFile(name='new_test_file.txt', content=bytes('test content hello vip_user', 'UTF-8'))
        response_3 = client_3.post('/mediafiles/new/',
                                   {'title': 'new_test_file_title_2',
                                    'mediafile': new_file_3})
        self.assertEqual(response_3.status_code, 403)

    @skip
    def test_edit_mediafile_get_request(self):
        clients = self.login_clients()
        response = clients['client_manager'].get('/mediafiles/1/edit/')
        self.assertContains(response, '---------', status_code=200)
        self.assertContains(response, '<option value="3" selected="selected">mediafile_test_normal_user</option>', status_code=200)
        self.assertTemplateUsed(response, 'mediafiles/mediafile_form.html')

        response = clients['client_vip_user'].get('/mediafiles/1/edit/')
        self.assertEqual(response.status_code, 403)

        response = clients['client_normal_user'].get('/mediafiles/1/edit/')
        self.assertEqual(response.status_code, 403)

    @skip
    def test_edit_mediafile_get_request_own_file(self):
        clients = self.login_clients()
        self.object.uploader = self.vip_user
        self.object.save()
        response = clients['client_vip_user'].get('/mediafiles/1/edit/')
        self.assertNotContains(response, '---------', status_code=200)
        self.assertNotContains(response, '<option value="2" selected="selected">mediafile_test_vip_user</option>', status_code=200)
        self.assertTemplateUsed(response, 'mediafiles/mediafile_form.html')

    @skip
    def test_edit_mediafile_post_request(self):
        # Test only one user
        tmpfile_no, mediafile_2_path = tempfile.mkstemp(prefix='tmp_openslides_test_', dir=self.tmp_dir)
        os.close(tmpfile_no)
        object_2 = Mediafile.objects.create(title='Title File 2', mediafile=mediafile_2_path, uploader=self.vip_user)
        client_1 = self.login_clients()['client_manager']
        new_file_1 = SimpleUploadedFile(name='new_test_file.txt', content=bytes('test content hello manager', 'UTF-8'))
        response_1 = client_1.post('/mediafiles/2/edit/',
                                   {'title': 'new_test_file_title_1',
                                    'mediafile': new_file_1,
                                    'uploader': self.manager.pk})
        self.assertEqual(response_1.status_code, 302)
        object_2 = Mediafile.objects.get(pk=2)
        self.assertEqual(object_2.mediafile.url, '/media/file/new_test_file.txt')
        self.assertEqual(object_2.uploader, self.manager)
        path_2 = object_2.mediafile.path
        object_2.mediafile.delete()
        self.assertFalse(os.path.exists(path_2))

    @skip
    def test_edit_mediafile_post_request_own_file(self):
        tmpfile_no, mediafile_2_path = tempfile.mkstemp(prefix='tmp_openslides_test_', dir=self.tmp_dir)
        os.close(tmpfile_no)
        object_2 = Mediafile.objects.create(title='Title File 2b', mediafile=mediafile_2_path, uploader=self.vip_user)
        client = self.login_clients()['client_vip_user']
        new_file_1 = SimpleUploadedFile(name='new_test_file.txt', content=bytes('test content hello vip user', 'UTF-8'))
        response_1 = client.post('/mediafiles/2/edit/',
                                 {'title': 'new_test_file_title_2b',
                                  'mediafile': new_file_1})
        self.assertEqual(response_1.status_code, 302)
        object_2 = Mediafile.objects.get(pk=2)
        self.assertEqual(object_2.mediafile.url, '/media/file/new_test_file.txt')
        self.assertEqual(object_2.uploader, self.vip_user)
        path_2 = object_2.mediafile.path
        object_2.mediafile.delete()
        self.assertFalse(os.path.exists(path_2))

    @skip
    def test_edit_mediafile_post_request_another_file(self):
        client = self.login_clients()['client_vip_user']
        new_file_1 = SimpleUploadedFile(name='new_test_file.txt', content=bytes('test content hello vip user', 'UTF-8'))
        response = client.post('/mediafiles/1/edit/',
                               {'title': 'new_test_file_title_2c',
                                'mediafile': new_file_1})
        self.assertEqual(response.status_code, 403)

    @skip
    def test_delete_mediafile_get_request(self):
        clients = self.login_clients()
        response = clients['client_manager'].get('/mediafiles/1/del/')
        self.assertRedirects(response, expected_url='/mediafiles/1/edit/', status_code=302, target_status_code=200)
        response = clients['client_vip_user'].get('/mediafiles/1/del/')
        self.assertEqual(response.status_code, 403)
        response = clients['client_normal_user'].get('/mediafiles/1/del/')
        self.assertEqual(response.status_code, 403)

    @skip
    def test_delete_mediafile_get_request_own_file(self):
        self.object.uploader = self.vip_user
        self.object.save()
        response = self.login_clients()['client_vip_user'].get('/mediafiles/1/del/')
        self.assertRedirects(response, expected_url='/mediafiles/1/edit/', status_code=302, target_status_code=200)

    @skip
    def test_delete_mediafile_post_request(self):
        tmpfile_no, mediafile_3_path = tempfile.mkstemp(prefix='tmp_openslides_test_', dir=self.tmp_dir)
        os.close(tmpfile_no)
        object_3 = Mediafile.objects.create(title='Title File 3', mediafile=mediafile_3_path)
        client_1 = self.login_clients()['client_manager']
        response_1 = client_1.post('/mediafiles/2/del/', {'yes': 'foo'})
        self.assertRedirects(response_1, expected_url='/mediafiles/', status_code=302, target_status_code=200)
        self.assertFalse(os.path.exists(object_3.mediafile.path))

    @skip
    def test_delete_mediafile_post_request_own_file(self):
        tmpfile_no, mediafile_3_path = tempfile.mkstemp(prefix='tmp_openslides_test_', dir=self.tmp_dir)
        os.close(tmpfile_no)
        object_3 = Mediafile.objects.create(title='Title File 3b', mediafile=mediafile_3_path, uploader=self.vip_user)
        client_1 = self.login_clients()['client_vip_user']
        response_1 = client_1.post('/mediafiles/2/del/', {'yes': 'foo'})
        self.assertRedirects(response_1, expected_url='/mediafiles/', status_code=302, target_status_code=200)
        self.assertFalse(os.path.exists(object_3.mediafile.path))

    @skip
    def test_delete_mediafile_post_request_another_file(self):
        tmpfile_no, mediafile_3_path = tempfile.mkstemp(prefix='tmp_openslides_test_', dir=self.tmp_dir)
        os.close(tmpfile_no)
        object_3 = Mediafile.objects.create(title='Title File 3c', mediafile=mediafile_3_path, uploader=self.normal_user)
        client_1 = self.login_clients()['client_vip_user']
        response = client_1.post('/mediafiles/2/del/', {'yes': 'foo'})
        self.assertEqual(response.status_code, 403)
        path_3 = object_3.mediafile.path
        self.assertTrue(os.path.exists(path_3))
        object_3.mediafile.delete()
        self.assertFalse(os.path.exists(path_3))

    def test_filesize(self):
        tmpfile_no, mediafile_4_path = tempfile.mkstemp(prefix='tmp_openslides_test_', dir=self.tmp_dir)
        os.close(tmpfile_no)
        object_4 = Mediafile.objects.create(title='Title File 4', mediafile=mediafile_4_path)
        self.assertEqual(object_4.get_filesize(), '< 1 kB')
        with open(object_4.mediafile.path, 'wb') as bigfile:
            bigfile.seek(2047)
            bigfile.write(b'0')
        self.assertEqual(object_4.get_filesize(), '2 kB')
        with open(object_4.mediafile.path, 'wb') as bigfile:
            bigfile.seek(1048575)
            bigfile.write(b'0')
        self.assertEqual(object_4.get_filesize(), '1 MB')
        os.remove(mediafile_4_path)
        self.assertEqual(object_4.get_filesize(), 'unknown')
