#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    Unit test for the list of speakers

    :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.test.client import Client

from openslides.utils.exceptions import OpenSlidesError
from openslides.utils.test import TestCase
from openslides.participant.models import User
from openslides.agenda.models import Item, Speaker


class ListOfSpeakerModelTests(TestCase):
    def setUp(self):
        self.item1 = Item.objects.create(title='item1')
        self.item2 = Item.objects.create(title='item2')
        self.speaker1 = User.objects.create(username='user1')
        self.speaker2 = User.objects.create(username='user2')

    def test_append_speaker(self):
        # Append speaker1 to the list of item1
        speaker1_item1 = Speaker.objects.add(self.speaker1, self.item1)
        self.assertTrue(Speaker.objects.filter(person=self.speaker1, item=self.item1).exists())

        # Append speaker1 to the list of item2
        speaker1_item2 = Speaker.objects.add(self.speaker1, self.item2)
        self.assertTrue(Speaker.objects.filter(person=self.speaker1, item=self.item2).exists())

        # Append speaker2 to the list of item1
        speaker2_item1 = Speaker.objects.add(self.speaker2, self.item1)
        self.assertTrue(Speaker.objects.filter(person=self.speaker2, item=self.item1).exists())

        # Try to append speaker 1 again to the list of item1
        with self.assertRaises(OpenSlidesError):
            Speaker.objects.add(self.speaker1, self.item1)

        # Check time and weight
        for object in (speaker1_item1, speaker2_item1, speaker1_item2):
            self.assertIsNone(object.time)
        self.assertEqual(speaker1_item1.weight, 1)
        self.assertEqual(speaker1_item2.weight, 1)
        self.assertEqual(speaker2_item1.weight, 2)

    def test_open_close_list_of_speaker(self):
        self.assertFalse(Item.objects.get(pk=self.item1.pk).speaker_list_closed)
        self.item1.speaker_list_closed = True
        self.item1.save()
        self.assertTrue(Item.objects.get(pk=self.item1.pk).speaker_list_closed)

    def test_speak(self):
        speaker1_item1 = Speaker.objects.add(self.speaker1, self.item1)

        self.assertIsNone(speaker1_item1.time)
        speaker1_item1.speak()
        self.assertIsNotNone(Speaker.objects.get(pk=speaker1_item1.pk).time)
        self.assertIsNone(Speaker.objects.get(pk=speaker1_item1.pk).weight)


class SpeakerViewTestCase(TestCase):
    def setUp(self):
        # Admin
        self.admin = User.objects.create_superuser('admin', 'admin@admin.admin', 'admin')
        self.admin_client = Client()
        self.admin_client.login(username='admin', password='admin')

        # Speaker1
        self.speaker1 = User.objects.create_user('speaker1', 'speaker1@user.user', 'speaker')
        self.speaker1_client = Client()
        self.speaker1_client.login(username='speaker1', password='speaker')

        # Speaker2
        self.speaker2 = User.objects.create_user('speaker2', 'speaker2@user.user', 'speaker')
        self.speaker2_client = Client()
        self.speaker2_client.login(username='speaker2', password='speaker')

        # Items
        self.item1 = Item.objects.create(title='item1')
        self.item2 = Item.objects.create(title='item2')

    def check_url(self, url, test_client, response_cose):
        response = test_client.get(url)
        self.assertEqual(response.status_code, response_cose)
        return response

    def assertMessage(self, response, message):
        self.assertTrue(message in response.cookies['messages'].value,
                        '"%s" is not a message of the response. (But: %s)'
                        % (message, response.cookies['messages'].value))


class TestSpeakerAppendView(SpeakerViewTestCase):
    def test_get(self):
        self.assertFalse(Speaker.objects.filter(person=self.speaker1, item=self.item1).exists())
        self.assertEqual(Speaker.objects.filter(item=self.item1).count(), 0)

        # Set speaker1 to item1
        self.check_url('/agenda/1/speaker/', self.speaker1_client, 302)
        self.assertTrue(Speaker.objects.filter(person=self.speaker1, item=self.item1).exists())
        self.assertEqual(Speaker.objects.filter(item=self.item1).count(), 1)

        # Try to set speaker 1 to item 1 again
        response = self.check_url('/agenda/1/speaker/', self.speaker1_client, 302)
        self.assertEqual(Speaker.objects.filter(item=self.item1).count(), 1)
        self.assertMessage(response, 'speaker1 is allready on the list of speakers from item 1')

    def test_closed_list(self):
        self.item1.speaker_list_closed = True
        self.item1.save()

        response = self.check_url('/agenda/1/speaker/', self.speaker1_client, 302)
        self.assertEqual(Speaker.objects.filter(item=self.item1).count(), 0)
        self.assertMessage(response, 'List of speakers is closed.')


class TestAgendaItemView(SpeakerViewTestCase):
    def test_post(self):
        # Set speaker1 to item1
        response = self.admin_client.post(
            '/agenda/1/', {'speaker': self.speaker1.person_id})
        self.assertTrue(Speaker.objects.filter(person=self.speaker1, item=self.item1).exists())

        # Try it again
        response = self.admin_client.post(
            '/agenda/1/', {'speaker': self.speaker1.person_id})
        self.assertFormError(response, 'form', 'speaker', 'speaker1 is allready on the list of speakers.')


class TestSpeakerDeleteView(SpeakerViewTestCase):
    def test_get(self):
        self.check_url('/agenda/1/speaker/del/', self.speaker1_client, 302)

    def test_post_as_admin(self):
        speaker = Speaker.objects.add(self.speaker1, self.item1)

        response = self.admin_client.post(
            '/agenda/1/speaker/%d/del/' % speaker.pk, {'yes': 'yes'})
        self.assertEqual(response.status_code, 302)
        self.assertFalse(Speaker.objects.filter(person=self.speaker1, item=self.item1).exists())

    def test_post_as_user(self):
        speaker = Speaker.objects.add(self.speaker1, self.item1)

        response = self.speaker1_client.post(
            '/agenda/1/speaker/del/', {'yes': 'yes'})
        self.assertEqual(response.status_code, 302)
        self.assertFalse(Speaker.objects.filter(person=self.speaker1, item=self.item1).exists())


class TestSpeakerSpeakView(SpeakerViewTestCase):
    def test_get(self):
        url = '/agenda/1/speaker/%s/speak/' % self.speaker1.person_id
        response = self.check_url(url, self.admin_client, 302)
        self.assertMessage(response, 'Person user:2 is not on the list of item item1.')

        speaker = Speaker.objects.add(self.speaker1, self.item1)
        response = self.check_url(url, self.admin_client, 302)
        speaker = Speaker.objects.get(pk=speaker.pk)
        self.assertIsNotNone(speaker.time)
        self.assertIsNone(speaker.weight)


class SpeakerListOpenView(SpeakerViewTestCase):
    def test_get(self):
        response = self.check_url('/agenda/1/speaker/close/', self.admin_client, 302)
        item = Item.objects.get(pk=self.item1.pk)
        self.assertTrue(item.speaker_list_closed)

        response = self.check_url('/agenda/1/speaker/open/', self.admin_client, 302)
        item = Item.objects.get(pk=self.item1.pk)
        self.assertFalse(item.speaker_list_closed)
