from openslides.agenda.models import Item, Speaker
from openslides.topics.models import Topic
from openslides.users.models import User
from openslides.utils.exceptions import OpenSlidesError
from openslides.utils.test import TestCase


class ListOfSpeakerModelTests(TestCase):
    def setUp(self):
        self.item1 = Topic.objects.create(title='item1').agenda_item
        self.item2 = Topic.objects.create(title='item2').agenda_item
        self.speaker1 = User.objects.create(username='user1')
        self.speaker2 = User.objects.create(username='user2')

    def test_append_speaker(self):
        # Append speaker1 to the list of item1
        speaker1_item1 = Speaker.objects.add(self.speaker1, self.item1)
        self.assertTrue(Speaker.objects.filter(user=self.speaker1, item=self.item1).exists())

        # Append speaker1 to the list of item2
        speaker1_item2 = Speaker.objects.add(self.speaker1, self.item2)
        self.assertTrue(Speaker.objects.filter(user=self.speaker1, item=self.item2).exists())

        # Append speaker2 to the list of item1
        speaker2_item1 = Speaker.objects.add(self.speaker2, self.item1)
        self.assertTrue(Speaker.objects.filter(user=self.speaker2, item=self.item1).exists())

        # Try to append speaker 1 again to the list of item1
        with self.assertRaises(OpenSlidesError):
            Speaker.objects.add(self.speaker1, self.item1)

        # Check time and weight
        for object in (speaker1_item1, speaker2_item1, speaker1_item2):
            self.assertIsNone(object.begin_time)
            self.assertIsNone(object.end_time)
        self.assertEqual(speaker1_item1.weight, 1)
        self.assertEqual(speaker1_item2.weight, 1)
        self.assertEqual(speaker2_item1.weight, 2)

    def test_open_close_list_of_speaker(self):
        self.assertFalse(Item.objects.get(pk=self.item1.pk).speaker_list_closed)
        self.item1.speaker_list_closed = True
        self.item1.save()
        self.assertTrue(Item.objects.get(pk=self.item1.pk).speaker_list_closed)

    def test_speak_and_finish(self):
        speaker1_item1 = Speaker.objects.add(self.speaker1, self.item1)
        self.assertIsNone(speaker1_item1.begin_time)
        self.assertIsNone(speaker1_item1.end_time)
        speaker1_item1.begin_speech()
        self.assertIsNotNone(Speaker.objects.get(pk=speaker1_item1.pk).begin_time)
        self.assertIsNone(Speaker.objects.get(pk=speaker1_item1.pk).weight)
        speaker1_item1.end_speech()
        self.assertIsNotNone(Speaker.objects.get(pk=speaker1_item1.pk).end_time)

    def test_finish_when_other_speaker_begins(self):
        speaker1_item1 = Speaker.objects.add(self.speaker1, self.item1)
        speaker2_item1 = Speaker.objects.add(self.speaker2, self.item1)
        speaker1_item1.begin_speech()
        self.assertIsNone(speaker1_item1.end_time)
        self.assertIsNone(speaker2_item1.begin_time)
        speaker2_item1.begin_speech()
        self.assertIsNotNone(Speaker.objects.get(user=self.speaker1, item=self.item1).end_time)
        self.assertIsNotNone(speaker2_item1.begin_time)
