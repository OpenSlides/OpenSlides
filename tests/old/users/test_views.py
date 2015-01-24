import re

from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from django.test.client import Client

from openslides.config.api import config
from openslides.users.api import get_registered_group
from openslides.users.models import Group, User
from openslides.utils.test import TestCase


class UserViews(TestCase):
    """
    Tests some views for users.
    """
    def setUp(self):
        self.admin = User.objects.get(pk=1)
        self.client = Client()
        self.client.login(username='admin', password='admin')

    def test_create(self):
        response = self.client.get('/user/new/')

        self.assertTemplateUsed(response, 'users/user_form.html')
        self.assertContains(response, 'New user')
        response = self.client.post('/user/new/', {'first_name': 'test_name_ho8hui2niz4nohSupahb'})
        self.assertRedirects(response, '/user/')

    def test_create_multiple(self):
        response = self.client.get('/user/new_multiple/')
        self.assertTemplateUsed(response, 'users/user_form_multiple.html')
        self.assertContains(response, 'New multiple users')
        self.assertEqual(User.objects.count(), 1)
        block = ('first_name_ksdjfhkjsdhf75utgeitrten last_name_khonizt958zh8fh\n'
                 'first_name_1_bmgnf7z8ru first_name_2_kjc98vivt last_name_dfg76kjkjuibv')
        response = self.client.post('/user/new_multiple/',
                                    {'users_block': block})
        self.assertEqual(User.objects.count(), 3)

    def test_update(self):
        response = self.client.get('/user/1/edit/')

        self.assertTemplateUsed(response, 'users/user_form.html')
        self.assertContains(response, 'Edit user')

        response = self.client.post(
            '/user/1/edit/',
            {'username': 'test_name_unaewae5Ir0saijeac2I',
             'first_name': 'test_name_aJi5jaizaVingaeF3Ohj',
             'groups': '4',
             'is_active': 'yes'})

        self.assertRedirects(response, '/user/')

    def test_activate(self):
        response = self.client.get('/user/1/status/activate/')
        self.assertEqual(response.status_code, 302)

    def test_reset_password(self):
        self.admin.default_password = new_password = 'password_ohweleeh1Shee5wibo1I'
        self.admin.save()
        self.client.post('/user/1/reset_password/', {'yes': 'yes'})
        self.assertTrue(self.client.login(username='admin', password=new_password))


class GroupViews(TestCase):
    """
    Tests the detail view for groups and later also the other views.
    """
    def setUp(self):
        self.user_1 = User.objects.get(pk=1)
        self.user_1.first_name = 'admins_first_name'
        self.user_1.save()

        self.user_2 = User.objects.create(last_name='uquahx3Wohtieph9baer',
                                          first_name='aWei4ien6Se0vie0xeiv',
                                          username='aWei4ien6Se0vie0xeiv uquahx3Wohtieph9baer')
        self.delegate = Group.objects.get(pk=3)
        self.user_1.groups.add(self.delegate)
        self.user_2.groups.add(self.delegate)

        self.client = Client()
        self.client.login(username='admin', password='admin')

    def test_detail(self):
        response = self.client.get('/user/group/3/')
        pattern = r'Administrator, admins_first_name|uquahx3Wohtieph9baer, aWei4ien6Se0vie0xeiv'
        match = re.findall(pattern, response.content.decode('utf8'))
        self.assertEqual(match[0], 'Administrator, admins_first_name')
        self.assertEqual(match[1], 'uquahx3Wohtieph9baer, aWei4ien6Se0vie0xeiv')

        config['users_sort_users_by_first_name'] = True
        self.assertTrue(config['users_sort_users_by_first_name'])
        response = self.client.get('/user/group/3/')
        pattern = r'admins_first_name Administrator|aWei4ien6Se0vie0xeiv uquahx3Wohtieph9baer'
        match = re.findall(pattern, response.content.decode('utf8'))
        self.assertEqual(match[1], 'admins_first_name Administrator')
        self.assertEqual(match[0], 'aWei4ien6Se0vie0xeiv uquahx3Wohtieph9baer')

    def test_create(self):
        response = self.client.get('/user/group/new/')

        self.assertTemplateUsed(response, 'users/group_form.html')
        self.assertContains(response, 'New group')

        response = self.client.post('/user/group/new/', {'name': 'test_group_name_Oeli1aeXoobohv8eikai'})

        self.assertRedirects(response, '/user/group/')

    def test_update(self):
        response = self.client.get('/user/group/1/edit/')

        self.assertTemplateUsed(response, 'users/group_form.html')
        self.assertContains(response, 'Edit group')

        response = self.client.post('/user/group/1/edit/', {'name': 'test_group_name_ahFeicoz5jedie4Fop0U'})

        self.assertRedirects(response, '/user/group/')


class LockoutProtection(TestCase):
    """
    Tests that a manager user can not lockout himself by doing
    something that removes his last permission to manage users. Tests
    also that he can see the user app (although there is no absolute
    protection).
    """
    def setUp(self):
        self.user = User.objects.get(pk=1)
        self.user.groups.add(Group.objects.get(pk=4))
        self.client = Client()
        self.client.login(username='admin', password='admin')
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(Group.objects.count(), 4)
        self.assertFalse(self.user.is_superuser)

    def test_delete_yourself(self):
        response = self.client.get('/user/1/del/')
        self.assertRedirects(response, '/user/1/')
        self.assertTrue('You can not delete yourself.' in response.cookies['messages'].value)
        response = self.client.post('/user/1/del/',
                                    {'yes': 'yes'})
        self.assertTrue('You can not delete yourself.' in response.cookies['messages'].value)
        self.assertRedirects(response, '/user/')
        self.assertEqual(User.objects.count(), 1)

    def test_delete_last_manager_group(self):
        response = self.client.get('/user/group/4/del/')
        self.assertRedirects(response, '/user/group/4/')
        self.assertTrue('You can not delete the last group containing the permission '
                        'to manage users you are in.' in response.cookies['messages'].value)
        response = self.client.post('/user/group/4/del/',
                                    {'yes': 'yes'})
        self.assertTrue('You can not delete the last group containing the permission '
                        'to manage users you are in.' in response.cookies['messages'].value)
        self.assertRedirects(response, '/user/group/')
        self.assertEqual(Group.objects.count(), 4)

    def test_remove_user_from_last_manager_group_via_UserUpdateView(self):
        response = self.client.post('/user/1/edit/',
                                    {'username': 'arae0eQu8eeghoogeik0',
                                     'groups': '3'})
        self.assertFormError(
            response=response,
            form='form',
            field=None,
            errors='You can not remove the last group containing the permission to manage users.')

    def test_remove_user_from_last_manager_group_via_GroupUpdateView(self):
        User.objects.get_or_create(username='foo', pk=2)
        response = self.client.post('/user/group/4/edit/',
                                    {'name': 'ChaeFaev4leephaiChae',
                                     'users': '2'})
        self.assertFormError(
            response=response,
            form='form',
            field=None,
            errors='You can not remove yourself from the last group containing the permission to manage users.')

    def test_remove_perm_from_last_manager_group(self):
        response = self.client.post('/user/group/4/edit/',
                                    {'name': 'ChaeFaev4leephaiChae',
                                     'users': '1',
                                     'permissions': []})
        self.assertFormError(
            response=response,
            form='form',
            field=None,
            errors='You can not remove the permission to manage users from the last group you are in.')

    def test_remove_permission_user_can_see_name_from_registered(self):
        self.assertTrue(self.user.has_perm('users.can_see_name'))
        # Remove perm from registered group
        can_see_perm = Permission.objects.get(
            content_type=ContentType.objects.get(app_label='users', model='user'),
            codename='can_see_name')
        get_registered_group().permissions.remove(can_see_perm)
        # Reload user
        self.user = User.objects.get(pk=1)
        self.assertTrue(self.user.has_perm('users.can_see_name'))


class TestUserSettings(TestCase):
    def setUp(self):
        self.admin = User.objects.get(pk=1)
        self.admin_client = Client()
        self.admin_client.login(username='admin', password='admin')

    def test_get(self):
        response = self.admin_client.get('/usersettings/')
        self.assertEqual(response.status_code, 200)

    def test_post(self):
        response = self.admin_client.post('/usersettings/', {
            'username': 'new_name',
            'language': 'de'})

        self.assertRedirects(response, '/usersettings/')

        admin = User.objects.get(pk=1)

        self.assertEqual(admin.username, 'new_name')
