from django.contrib.auth import get_user_model
from django.core.urlresolvers import reverse
from rest_framework.test import APIClient

from openslides.agenda.models import Item, Speaker
from openslides.core.config import config
from openslides.core.models import Projector
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

    def test_remove_someone_else_invalid_data(self):
        response = self.client.delete(
            reverse('item-manage-speaker', args=[self.item.pk]),
            {'speaker': 'invalid'})
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


class Speak(TestCase):
    """
    Tests view to begin or end speech.
    """
    def setUp(self):
        self.client = APIClient()
        self.client.login(username='admin', password='admin')
        self.item = Item.objects.create(title='test_title_KooDueco3zaiGhiraiho')
        self.user = get_user_model().objects.create_user(
            username='test_user_Aigh4vohb3seecha4aa4',
            password='test_password_eneupeeVo5deilixoo8j')

    def test_begin_speech(self):
        Speaker.objects.add(self.user, self.item)
        speaker = Speaker.objects.add(get_user_model().objects.get(username='admin'), self.item)
        self.assertTrue(Speaker.objects.get(pk=speaker.pk).begin_time is None)
        response = self.client.put(
            reverse('item-speak', args=[self.item.pk]),
            {'speaker': speaker.pk})
        self.assertEqual(response.status_code, 200)
        self.assertFalse(Speaker.objects.get(pk=speaker.pk).begin_time is None)

    def test_begin_speech_next_speaker(self):
        speaker = Speaker.objects.add(self.user, self.item)
        Speaker.objects.add(get_user_model().objects.get(username='admin'), self.item)

        response = self.client.put(reverse('item-speak', args=[self.item.pk]))

        self.assertEqual(response.status_code, 200)
        self.assertFalse(Speaker.objects.get(pk=speaker.pk).begin_time is None)

    def test_begin_speech_invalid_speaker_id(self):
        response = self.client.put(
            reverse('item-speak', args=[self.item.pk]),
            {'speaker': '1'})
        self.assertEqual(response.status_code, 400)

    def test_begin_speech_invalid_data(self):
        response = self.client.put(
            reverse('item-speak', args=[self.item.pk]),
            {'speaker': 'invalid'})
        self.assertEqual(response.status_code, 400)

    def test_end_speech(self):
        speaker = Speaker.objects.add(get_user_model().objects.get(username='admin'), self.item)
        speaker.begin_speech()
        self.assertFalse(Speaker.objects.get(pk=speaker.pk).begin_time is None)
        self.assertTrue(Speaker.objects.get(pk=speaker.pk).end_time is None)
        response = self.client.delete(reverse('item-speak', args=[self.item.pk]))
        self.assertEqual(response.status_code, 200)
        self.assertFalse(Speaker.objects.get(pk=speaker.pk).end_time is None)

    def test_end_speech_no_current_speaker(self):
        response = self.client.delete(reverse('item-speak', args=[self.item.pk]))
        self.assertEqual(response.status_code, 400)

    def test_begin_speech_with_countdown(self):
        config['agenda_couple_countdown_and_speakers'] = True
        Speaker.objects.add(self.user, self.item)
        speaker = Speaker.objects.add(get_user_model().objects.get(username='admin'), self.item)
        self.assertEqual(Projector.objects.get().config[2]['name'], 'core/countdown')
        self.client.put(
            reverse('item-speak', args=[self.item.pk]),
            {'speaker': speaker.pk})
        self.assertEqual(Projector.objects.get().config[2]['status'], 'running')

    def test_end_speech_with_countdown(self):
        config['agenda_couple_countdown_and_speakers'] = True
        speaker = Speaker.objects.add(get_user_model().objects.get(username='admin'), self.item)
        speaker.begin_speech()
        self.assertEqual(Projector.objects.get().config[2]['name'], 'core/countdown')
        self.client.delete(reverse('item-speak', args=[self.item.pk]))
        self.assertEqual(Projector.objects.get().config[2]['status'], 'stop')
