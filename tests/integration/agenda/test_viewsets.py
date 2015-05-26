from django.contrib.auth import get_user_model
from django.core.urlresolvers import reverse
from rest_framework.test import APIClient

from openslides.agenda.models import Item, Speaker
from openslides.utils.test import TestCase


class ManageSpeaker(TestCase):
    """
    Tests managing speakers.
    """
    def setUp(self):
        self.client = APIClient()
        self.client.login(username='admin', password='admin')
        self.item = Item.objects.create(title='test_title_aZaedij4gohn5eeQu8fe')
        self.user = get_user_model().objects.create_user(
            username='test_user_jooSaex1bo5ooPhuphae',
            password='test_password_e6paev4zeeh9n')

    def test_add_oneself(self):
        response = self.client.post(
            reverse('item-manage-speaker', args=[self.item.pk]))
        self.assertEqual(response.status_code, 200)
        self.assertTrue(Speaker.objects.all().exists())

    def test_add_oneself_twice(self):
        Speaker.objects.add(get_user_model().objects.get(username='admin'), self.item)
        response = self.client.post(
            reverse('item-manage-speaker', args=[self.item.pk]))
        self.assertEqual(response.status_code, 400)

    def test_add_oneself_when_closed(self):
        self.item.speaker_list_closed = True
        self.item.save()
        response = self.client.post(
            reverse('item-manage-speaker', args=[self.item.pk]))
        self.assertEqual(response.status_code, 400)

    def test_remove_oneself(self):
        Speaker.objects.add(get_user_model().objects.get(username='admin'), self.item)
        response = self.client.delete(
            reverse('item-manage-speaker', args=[self.item.pk]))
        self.assertEqual(response.status_code, 200)
        self.assertFalse(Speaker.objects.all().exists())

    def test_remove_self_not_on_list(self):
        response = self.client.delete(
            reverse('item-manage-speaker', args=[self.item.pk]))
        self.assertEqual(response.status_code, 400)

    def test_add_someone_else(self):
        response = self.client.post(
            reverse('item-manage-speaker', args=[self.item.pk]),
            {'user': self.user.pk})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(Speaker.objects.filter(item=self.item, user=self.user).exists())

    def test_invalid_data_string_instead_of_integer(self):
        response = self.client.post(
            reverse('item-manage-speaker', args=[self.item.pk]),
            {'user': 'string_instead_of_integer'})

        self.assertEqual(response.status_code, 400)

    def test_invalid_data_user_does_not_exist(self):
        # ID of a user that does not exist.
        # Be careful: Here we do not test that the user does not exist.
        inexistent_user_pk = self.user.pk + 1000
        response = self.client.post(
            reverse('item-manage-speaker', args=[self.item.pk]),
            {'user': inexistent_user_pk})
        self.assertEqual(response.status_code, 400)

    def test_add_someone_else_twice(self):
        Speaker.objects.add(self.user, self.item)
        response = self.client.post(
            reverse('item-manage-speaker', args=[self.item.pk]),
            {'user': self.user.pk})
        self.assertEqual(response.status_code, 400)

    def test_add_someone_else_non_admin(self):
        admin = get_user_model().objects.get(username='admin')
        group_staff = admin.groups.get(name='Staff')
        group_delegates = type(group_staff).objects.get(name='Delegates')
        admin.groups.add(group_delegates)
        admin.groups.remove(group_staff)
        response = self.client.post(
            reverse('item-manage-speaker', args=[self.item.pk]),
            {'user': self.user.pk})
        self.assertEqual(response.status_code, 403)

    def test_remove_someone_else(self):
        speaker = Speaker.objects.add(self.user, self.item)
        response = self.client.delete(
            reverse('item-manage-speaker', args=[self.item.pk]),
            {'speaker': speaker.pk})
        self.assertEqual(response.status_code, 200)
        self.assertFalse(Speaker.objects.filter(item=self.item, user=self.user).exists())

    def test_remove_someone_else_not_on_list(self):
        response = self.client.delete(
            reverse('item-manage-speaker', args=[self.item.pk]),
            {'speaker': '1'})
        self.assertEqual(response.status_code, 400)

    def test_remove_someone_else_non_admin(self):
        admin = get_user_model().objects.get(username='admin')
        group_staff = admin.groups.get(name='Staff')
        group_delegates = type(group_staff).objects.get(name='Delegates')
        admin.groups.add(group_delegates)
        admin.groups.remove(group_staff)
        speaker = Speaker.objects.add(self.user, self.item)
        response = self.client.delete(
            reverse('item-manage-speaker', args=[self.item.pk]),
            {'speaker': speaker.pk})
        self.assertEqual(response.status_code, 403)
