from django.contrib.auth import get_user_model
from django.core.urlresolvers import reverse
from rest_framework import status
from rest_framework.test import APIClient

from openslides.agenda.models import Item, Speaker
from openslides.assignments.models import Assignment
from openslides.core.config import config
from openslides.core.models import Projector
from openslides.motions.models import Motion
from openslides.topics.models import Topic
from openslides.users.models import User
from openslides.utils.test import TestCase


class RetrieveItem(TestCase):
    """
    Tests retrieving items.
    """
    def setUp(self):
        self.client = APIClient()
        config['general_system_enable_anonymous'] = True
        self.item = Topic.objects.create(title='test_title_Idais2pheepeiz5uph1c').agenda_item

    def test_normal_by_anonymous_without_perm_to_see_hidden_items(self):
        group = get_user_model().groups.field.related_model.objects.get(pk=1)  # Group with pk 1 is for anonymous users.
        permission_string = 'agenda.can_see_hidden_items'
        app_label, codename = permission_string.split('.')
        permission = group.permissions.get(content_type__app_label=app_label, codename=codename)
        group.permissions.remove(permission)
        self.item.type = Item.AGENDA_ITEM
        self.item.save()
        response = self.client.get(reverse('item-detail', args=[self.item.pk]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_hidden_by_anonymous_without_perm_to_see_hidden_items(self):
        group = get_user_model().groups.field.related_model.objects.get(pk=1)  # Group with pk 1 is for anonymous users.
        permission_string = 'agenda.can_see_hidden_items'
        app_label, codename = permission_string.split('.')
        permission = group.permissions.get(content_type__app_label=app_label, codename=codename)
        group.permissions.remove(permission)
        response = self.client.get(reverse('item-detail', args=[self.item.pk]))
        self.assertEqual(response.status_code, status.HTTP_403_PERMISSION_DENIED)


class TestDBQueries(TestCase):
    """
    Tests that receiving elements only need the required db queries.

    Therefore in setup some agenda items are created and received with different
    user accounts.
    """

    def setUp(self):
        self.client = APIClient()
        config['general_system_enable_anonymous'] = True
        for index in range(10):
            Topic.objects.create(title='topic{}'.format(index))
        parent = Topic.objects.create(title='parent').agenda_item
        child = Topic.objects.create(title='child').agenda_item
        child.parent = parent
        child.save()
        Motion.objects.create(title='motion1')
        Motion.objects.create(title='motion2')
        Assignment.objects.create(title='assignment', open_posts=5)

    def test_admin(self):
        """
        Tests that only the following db queries are done:
        * 5 requests to get the session an the request user with its permissions,
        * 2 requests to get the list of all agenda items,
        * 1 request to get all speakers,
        * 3 requests to get the assignments, motions and topics and

        * 2 requests for the motionsversions.

        TODO: There could be less requests to get the session and the request user.
        The last two request for the motionsversions are a bug.
        """
        self.client.force_login(User.objects.get(pk=1))
        with self.assertNumQueries(13):
            self.client.get(reverse('item-list'))

    def test_anonymous(self):
        """
        Tests that only the following db queries are done:
        * 2 requests to get the permission for anonymous (config and permissions)
        * 2 requests to get the list of all agenda items,
        * 1 request to get all speakers,
        * 3 requests to get the assignments, motions and topics and

        * 32 requests for the motionsversions.

        TODO: The last 32 requests are a bug.
        """
        with self.assertNumQueries(40):
            self.client.get(reverse('item-list'))


class ManageSpeaker(TestCase):
    """
    Tests managing speakers.
    """
    def setUp(self):
        self.client = APIClient()
        self.client.login(username='admin', password='admin')

        self.item = Topic.objects.create(title='test_title_aZaedij4gohn5eeQu8fe').agenda_item
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
        self.item = Topic.objects.create(title='test_title_KooDueco3zaiGhiraiho').agenda_item
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
        self.client.put(
            reverse('item-speak', args=[self.item.pk]),
            {'speaker': speaker.pk})
        for key, value in Projector.objects.get().config.items():
            if value['name'] == 'core/countdown':
                self.assertTrue(value['running'])
                # If created, the countdown should have index 1
                created = value['index'] == 1
                break
        else:
            created = False
        self.assertTrue(created)

    def test_end_speech_with_countdown(self):
        config['agenda_couple_countdown_and_speakers'] = True
        speaker = Speaker.objects.add(get_user_model().objects.get(username='admin'), self.item)
        speaker.begin_speech()
        self.client.delete(reverse('item-speak', args=[self.item.pk]))
        for key, value in Projector.objects.get().config.items():
            if value['name'] == 'core/countdown':
                self.assertFalse(value['running'])
                success = True
                break
        else:
            success = False
        self.assertTrue(success)


class Numbering(TestCase):
    """
    Tests view to number the agenda
    """
    def setUp(self):
        self.client = APIClient()
        self.client.login(username='admin', password='admin')
        self.item_1 = Topic.objects.create(title='test_title_thuha8eef7ohXar3eech').agenda_item
        self.item_1.type = Item.AGENDA_ITEM
        self.item_1.weight = 1
        self.item_1.save()
        self.item_2 = Topic.objects.create(title='test_title_eisah7thuxa1eingaeLo').agenda_item
        self.item_2.type = Item.AGENDA_ITEM
        self.item_2.weight = 2
        self.item_2.save()
        self.item_2_1 = Topic.objects.create(title='test_title_Qui0audoaz5gie1phish').agenda_item
        self.item_2_1.type = Item.AGENDA_ITEM
        self.item_2_1.parent = self.item_2
        self.item_2_1.save()
        self.item_3 = Topic.objects.create(title='test_title_ah7tphisheineisgaeLo').agenda_item
        self.item_3.type = Item.AGENDA_ITEM
        self.item_3.weight = 3
        self.item_3.save()

    def test_numbering(self):
        response = self.client.post(reverse('item-numbering'))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Item.objects.get(pk=self.item_1.pk).item_number, '1')
        self.assertEqual(Item.objects.get(pk=self.item_2.pk).item_number, '2')
        self.assertEqual(Item.objects.get(pk=self.item_2_1.pk).item_number, '2.1')
        self.assertEqual(Item.objects.get(pk=self.item_3.pk).item_number, '3')

    def test_roman_numbering(self):
        config['agenda_numeral_system'] = 'roman'

        response = self.client.post(reverse('item-numbering'))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(Item.objects.get(pk=self.item_1.pk).item_number, 'I')
        self.assertEqual(Item.objects.get(pk=self.item_2.pk).item_number, 'II')
        self.assertEqual(Item.objects.get(pk=self.item_2_1.pk).item_number, 'II.1')
        self.assertEqual(Item.objects.get(pk=self.item_3.pk).item_number, 'III')

    def test_with_hidden_item(self):
        self.item_2.type = Item.HIDDEN_ITEM
        self.item_2.save()

        response = self.client.post(reverse('item-numbering'))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(Item.objects.get(pk=self.item_1.pk).item_number, '1')
        self.assertEqual(Item.objects.get(pk=self.item_2.pk).item_number, '')
        self.assertEqual(Item.objects.get(pk=self.item_2_1.pk).item_number, '')
        self.assertEqual(Item.objects.get(pk=self.item_3.pk).item_number, '2')

    def test_reset_numbering_with_hidden_item(self):
        self.item_2.item_number = 'test_number_Cieghae6ied5ool4hiem'
        self.item_2.type = Item.HIDDEN_ITEM
        self.item_2.save()
        self.item_2_1.item_number = 'test_number_roQueTohg7fe1Is7aemu'
        self.item_2_1.save()

        response = self.client.post(reverse('item-numbering'))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(Item.objects.get(pk=self.item_1.pk).item_number, '1')
        self.assertEqual(Item.objects.get(pk=self.item_2.pk).item_number, '')
        self.assertEqual(Item.objects.get(pk=self.item_2_1.pk).item_number, '')
        self.assertEqual(Item.objects.get(pk=self.item_3.pk).item_number, '2')
