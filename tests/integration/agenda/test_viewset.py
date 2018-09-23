import pytest
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.urls import reverse
from django.utils.translation import ugettext
from rest_framework import status
from rest_framework.test import APIClient

from openslides.agenda.models import Item, Speaker
from openslides.assignments.models import Assignment
from openslides.core.config import config
from openslides.core.models import Countdown
from openslides.motions.models import Motion
from openslides.topics.models import Topic
from openslides.users.models import Group
from openslides.utils.autoupdate import inform_changed_data
from openslides.utils.collection import CollectionElement
from openslides.utils.test import TestCase

from ..helpers import count_queries


class RetrieveItem(TestCase):
    """
    Tests retrieving items.
    """
    def setUp(self):
        self.client = APIClient()
        config['general_system_enable_anonymous'] = True
        self.item = Topic.objects.create(title='test_title_Idais2pheepeiz5uph1c').agenda_item

    def test_normal_by_anonymous_without_perm_to_see_internal_items(self):
        group = get_user_model().groups.field.related_model.objects.get(pk=1)  # Group with pk 1 is for anonymous users.
        permission_string = 'agenda.can_see_internal_items'
        app_label, codename = permission_string.split('.')
        permission = group.permissions.get(content_type__app_label=app_label, codename=codename)
        group.permissions.remove(permission)
        self.item.type = Item.AGENDA_ITEM
        self.item.save()
        response = self.client.get(reverse('item-detail', args=[self.item.pk]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_hidden_by_anonymous_without_manage_perms(self):
        response = self.client.get(reverse('item-detail', args=[self.item.pk]))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_hidden_by_anonymous_with_manage_perms(self):
        group = Group.objects.get(pk=1)  # Group with pk 1 is for anonymous users.
        permission_string = 'agenda.can_manage'
        app_label, codename = permission_string.split('.')
        permission = Permission.objects.get(content_type__app_label=app_label, codename=codename)
        group.permissions.add(permission)
        inform_changed_data(group)
        response = self.client.get(reverse('item-detail', args=[self.item.pk]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_internal_by_anonymous_without_perm_to_see_internal_items(self):
        group = Group.objects.get(pk=1)  # Group with pk 1 is for anonymous users.
        permission_string = 'agenda.can_see_internal_items'
        app_label, codename = permission_string.split('.')
        permission = group.permissions.get(content_type__app_label=app_label, codename=codename)
        group.permissions.remove(permission)
        inform_changed_data(group)
        self.item.type = Item.INTERNAL_ITEM
        self.item.save()
        response = self.client.get(reverse('item-detail', args=[self.item.pk]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(sorted(response.data.keys()), sorted((
            'id',
            'title',
            'speakers',
            'speaker_list_closed',
            'content_object',)))
        forbidden_keys = (
            'item_number',
            'title_with_type',
            'comment',
            'closed',
            'type',
            'is_internal',
            'is_hidden',
            'duration',
            'weight',
            'parent',)
        for key in forbidden_keys:
            self.assertFalse(key in response.data.keys())

    def test_normal_by_anonymous_cant_see_agenda_comments(self):
        self.item.type = Item.AGENDA_ITEM
        self.item.comment = 'comment_gbiejd67gkbmsogh8374jf$kd'
        self.item.save()
        response = self.client.get(reverse('item-detail', args=[self.item.pk]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('comment') is None)


@pytest.mark.django_db(transaction=False)
def test_agenda_item_db_queries():
    """
    Tests that only the following db queries are done:
    * 1 requests to get the list of all agenda items,
    * 1 request to get all speakers,
    * 3 requests to get the assignments, motions and topics and

    * 1 request to get an agenda item (why?)
    TODO: The last three request are a bug.
    """
    for index in range(10):
        Topic.objects.create(title='topic{}'.format(index))
    parent = Topic.objects.create(title='parent').agenda_item
    child = Topic.objects.create(title='child').agenda_item
    child.parent = parent
    child.save()
    Motion.objects.create(title='motion1')
    Motion.objects.create(title='motion2')
    Assignment.objects.create(title='assignment', open_posts=5)

    assert count_queries(Item.get_elements) == 6


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
        group_admin = admin.groups.get(name='Admin')
        group_delegates = type(group_admin).objects.get(name='Delegates')
        admin.groups.add(group_delegates)
        admin.groups.remove(group_admin)
        inform_changed_data(admin)
        CollectionElement.from_instance(admin)

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
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data.get('detail'),
                         ugettext('No speakers have been removed from the list of speakers.'))

    def test_remove_someone_else_invalid_data(self):
        response = self.client.delete(
            reverse('item-manage-speaker', args=[self.item.pk]),
            {'speaker': 'invalid'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data.get('detail'),
                         ugettext('No speakers have been removed from the list of speakers.'))

    def test_remove_someone_else_non_admin(self):
        admin = get_user_model().objects.get(username='admin')
        group_admin = admin.groups.get(name='Admin')
        group_delegates = type(group_admin).objects.get(name='Delegates')
        admin.groups.add(group_delegates)
        admin.groups.remove(group_admin)
        inform_changed_data(admin)
        speaker = Speaker.objects.add(self.user, self.item)

        response = self.client.delete(
            reverse('item-manage-speaker', args=[self.item.pk]),
            {'speaker': speaker.pk})
        self.assertEqual(response.status_code, 403)

    def test_mark_speaker(self):
        Speaker.objects.add(self.user, self.item)
        response = self.client.patch(
            reverse('item-manage-speaker', args=[self.item.pk]),
            {
                'user': self.user.pk,
                'marked': True,
            },
            format='json'
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(Speaker.objects.get().marked)

    def test_mark_speaker_non_admin(self):
        admin = get_user_model().objects.get(username='admin')
        group_admin = admin.groups.get(name='Admin')
        group_delegates = type(group_admin).objects.get(name='Delegates')
        admin.groups.add(group_delegates)
        admin.groups.remove(group_admin)
        inform_changed_data(admin)
        Speaker.objects.add(self.user, self.item)

        response = self.client.patch(
            reverse('item-manage-speaker', args=[self.item.pk]),
            {'user': self.user.pk})

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
        # Countdown should be created with pk=1 and running
        self.assertEqual(Countdown.objects.all().count(), 1)
        countdown = Countdown.objects.get(pk=1)
        self.assertTrue(countdown.running)

    def test_end_speech_with_countdown(self):
        config['agenda_couple_countdown_and_speakers'] = True
        speaker = Speaker.objects.add(get_user_model().objects.get(username='admin'), self.item)
        speaker.begin_speech()
        self.client.delete(reverse('item-speak', args=[self.item.pk]))
        # Countdown should be created with pk=1 and stopped
        self.assertEqual(Countdown.objects.all().count(), 1)
        countdown = Countdown.objects.get(pk=1)
        self.assertFalse(countdown.running)


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

    def test_deactivated_numbering(self):
        config['agenda_enable_numbering'] = False

        response = self.client.post(reverse('item-numbering'))
        self.assertEqual(response.status_code, 400)

    def test_roman_numbering(self):
        config['agenda_numeral_system'] = 'roman'

        response = self.client.post(reverse('item-numbering'))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(Item.objects.get(pk=self.item_1.pk).item_number, 'I')
        self.assertEqual(Item.objects.get(pk=self.item_2.pk).item_number, 'II')
        self.assertEqual(Item.objects.get(pk=self.item_2_1.pk).item_number, 'II.1')
        self.assertEqual(Item.objects.get(pk=self.item_3.pk).item_number, 'III')

    def test_with_internal_item(self):
        self.item_2.type = Item.INTERNAL_ITEM
        self.item_2.save()

        response = self.client.post(reverse('item-numbering'))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(Item.objects.get(pk=self.item_1.pk).item_number, '1')
        self.assertEqual(Item.objects.get(pk=self.item_2.pk).item_number, '')
        self.assertEqual(Item.objects.get(pk=self.item_2_1.pk).item_number, '')
        self.assertEqual(Item.objects.get(pk=self.item_3.pk).item_number, '2')

    def test_reset_numbering_with_internal_item(self):
        self.item_2.item_number = 'test_number_Cieghae6ied5ool4hiem'
        self.item_2.type = Item.INTERNAL_ITEM
        self.item_2.save()
        self.item_2_1.item_number = 'test_number_roQueTohg7fe1Is7aemu'
        self.item_2_1.save()

        response = self.client.post(reverse('item-numbering'))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(Item.objects.get(pk=self.item_1.pk).item_number, '1')
        self.assertEqual(Item.objects.get(pk=self.item_2.pk).item_number, '')
        self.assertEqual(Item.objects.get(pk=self.item_2_1.pk).item_number, '')
        self.assertEqual(Item.objects.get(pk=self.item_3.pk).item_number, '2')
