#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.mediafile.tests
    ~~~~~~~~~~~~~~~~~~~~~~~~~~

    Unit test for the mediafile app.

    :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

import os
import tempfile

from django.test import TestCase
from django.test.client import Client
from django.core.files.uploadedfile import SimpleUploadedFile
from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth.models import Permission

from openslides.mediafile.models import Mediafile
from openslides.participant.models import User


class MediafileTest(TestCase):
    """
    Unit test for the mediafile model.
    """
    def setUp(self):
        # Setup a mediafile object
        self.tmp_dir = settings.MEDIA_ROOT  # TODO: Find a way not to have to create the path manually.
        mediafile_path = tempfile.mkstemp(prefix='tmp_openslides_test', dir=self.tmp_dir)[1]
        self.object = Mediafile.objects.create(title='Title File 1', mediafile=mediafile_path)

        # Setup the three permissions
        ct = ContentType.objects.get(app_label='mediafile', model='mediafile')
        perm_1 = Permission.objects.get(content_type=ct, codename='can_see')
        perm_2 = Permission.objects.get(content_type=ct, codename='can_upload')
        perm_3 = Permission.objects.get(content_type=ct, codename='can_manage')

        # Setup three different users
        self.manager = User.objects.create(username='mediafile_test_manager')
        self.manager.reset_password('default')
        self.manager.user_permissions.add(perm_1, perm_2, perm_3)
        self.vip_user = User.objects.create(username='mediafile_test_vip_user')
        self.vip_user.reset_password('default')
        self.vip_user.user_permissions.add(perm_1, perm_2)
        self.normal_user = User.objects.create(username='mediafile_test_normal_user')
        self.normal_user.reset_password('default')
        self.normal_user.user_permissions.add(perm_1)

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
        client_manager.login(username='mediafile_test_manager', password='default')
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
        bad_client = Client()
        response = bad_client.get('/mediafile/')
        self.assertEqual(response.status_code, 302)

    def test_upload_mediafile_get_request(self):
        clients = self.login_clients()
        response = clients['client_manager'].get('/mediafile/new/')
        self.assertEqual(response.status_code, 200)
        response = clients['client_vip_user'].get('/mediafile/new/')
        self.assertEqual(response.status_code, 200)
        response = clients['client_normal_user'].get('/mediafile/new/')
        self.assertEqual(response.status_code, 403)
        bad_client = Client()
        response = bad_client.get('/mediafile/new/')
        self.assertEqual(response.status_code, 302)

    def test_upload_mediafile_post_request(self):
        # Test first user
        client_1 = self.login_clients()['client_manager']
        new_file_1 = SimpleUploadedFile(name='new_test_file.txt', content='test content hello manager')
        response_1 = client_1.post('/mediafile/new/',
                               {'title': 'new_test_file_title_1',
                                'mediafile': new_file_1})
        self.assertEqual(response_1.status_code, 302)
        object_1 = Mediafile.objects.latest('timestamp')
        self.assertEqual(object_1.mediafile.url, '/media/file/new_test_file.txt')
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
        object_2 = Mediafile.objects.latest('timestamp')
        self.assertEqual(object_2.mediafile.url, '/media/file/new_test_file.txt')
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
        self.assertEqual(response.status_code, 200)
        response = clients['client_vip_user'].get('/mediafile/1/edit/')
        self.assertEqual(response.status_code, 403)
        response = clients['client_normal_user'].get('/mediafile/1/edit/')
        self.assertEqual(response.status_code, 403)
        bad_client = Client()
        response = bad_client.get('/mediafile/1/edit/')
        self.assertEqual(response.status_code, 302)

    def test_edit_mediafile_post_request(self):
        # Test only one user
        mediafile_2_path = tempfile.mkstemp(prefix='tmp_openslides_test', dir=self.tmp_dir)[1]
        object_2 = Mediafile.objects.create(title='Title File 2', mediafile=mediafile_2_path)

        client_1 = self.login_clients()['client_manager']
        new_file_1 = SimpleUploadedFile(name='new_test_file.txt', content='test content hello manager')
        response_1 = client_1.post('/mediafile/2/edit/',
                               {'title': 'new_test_file_title_1',
                                'mediafile': new_file_1})
        self.assertEqual(response_1.status_code, 302)
        object_2 = Mediafile.objects.get(pk=2)
        self.assertEqual(object_2.mediafile.url, '/media/file/new_test_file.txt')
        path_2 = object_2.mediafile.path
        object_2.mediafile.delete()
        self.assertFalse(os.path.exists(path_2))

    def test_delete_mediafile_get_request(self):
        clients = self.login_clients()
        response = clients['client_manager'].get('/mediafile/1/del/')
        self.assertEqual(response.status_code, 302)
        response = clients['client_vip_user'].get('/mediafile/1/del/')
        self.assertEqual(response.status_code, 403)
        response = clients['client_normal_user'].get('/mediafile/1/del/')
        self.assertEqual(response.status_code, 403)
        bad_client = Client()
        response = bad_client.get('/mediafile/2/del/')
        self.assertEqual(response.status_code, 302)

    def test_delete_mediafile_post_request(self):
        mediafile_3_path = tempfile.mkstemp(prefix='tmp_openslides_test', dir=self.tmp_dir)[1]
        object_3 = Mediafile.objects.create(title='Title File 3', mediafile=mediafile_3_path)
        client_1 = self.login_clients()['client_manager']
        response_1 = client_1.post('/mediafile/2/del/', {'yes': 'foo'})
        self.assertEqual(response_1.status_code, 302)

    def test_filesize(self):
        mediafile_4_path = tempfile.mkstemp(prefix='tmp_openslides_test', dir=self.tmp_dir)[1]
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
        object_4.mediafile.delete()
