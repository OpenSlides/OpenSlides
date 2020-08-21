from openslides.agenda.models import ListOfSpeakers, Speaker
from openslides.topics.models import Topic
from openslides.users.models import User
from openslides.utils.exceptions import OpenSlidesError
from tests.test_case import TestCase


class ListOfSpeakerModelTests(TestCase):
    def setUp(self):
        self.list_of_speakers_1 = Topic.objects.create(
            title="list_of_speakers_1"
        ).list_of_speakers
        self.list_of_speakers_2 = Topic.objects.create(
            title="list_of_speakers_2"
        ).list_of_speakers
        self.speaker1 = User.objects.create(username="user1")
        self.speaker2 = User.objects.create(username="user2")

    def test_append_speaker(self):
        # Append speaker1 to the list of list_of_speakers_1
        speaker1_los1 = Speaker.objects.add(self.speaker1, self.list_of_speakers_1)
        self.assertTrue(
            Speaker.objects.filter(
                user=self.speaker1, list_of_speakers=self.list_of_speakers_1
            ).exists()
        )

        # Append speaker1 to the list of list_of_speakers_2
        speaker1_los2 = Speaker.objects.add(self.speaker1, self.list_of_speakers_2)
        self.assertTrue(
            Speaker.objects.filter(
                user=self.speaker1, list_of_speakers=self.list_of_speakers_2
            ).exists()
        )

        # Append speaker2 to the list of list_of_speakers_1
        speaker2_los1 = Speaker.objects.add(self.speaker2, self.list_of_speakers_1)
        self.assertTrue(
            Speaker.objects.filter(
                user=self.speaker2, list_of_speakers=self.list_of_speakers_1
            ).exists()
        )

        # Try to append speaker 1 again to the list of list_of_speakers_1
        with self.assertRaises(OpenSlidesError):
            Speaker.objects.add(self.speaker1, self.list_of_speakers_1)

        # Check time and weight
        for object in (speaker1_los1, speaker2_los1, speaker1_los2):
            self.assertIsNone(object.begin_time)
            self.assertIsNone(object.end_time)
        self.assertEqual(speaker1_los1.weight, 1)
        self.assertEqual(speaker1_los2.weight, 1)
        self.assertEqual(speaker2_los1.weight, 2)

    def test_open_close_list_of_speaker(self):
        self.assertFalse(
            ListOfSpeakers.objects.get(pk=self.list_of_speakers_1.pk).closed
        )
        self.list_of_speakers_1.closed = True
        self.list_of_speakers_1.save()
        self.assertTrue(
            ListOfSpeakers.objects.get(pk=self.list_of_speakers_1.pk).closed
        )

    def test_speak_and_finish(self):
        speaker1_los1 = Speaker.objects.add(self.speaker1, self.list_of_speakers_1)
        self.assertIsNone(speaker1_los1.begin_time)
        self.assertIsNone(speaker1_los1.end_time)
        speaker1_los1.begin_speech()
        self.assertIsNotNone(Speaker.objects.get(pk=speaker1_los1.pk).begin_time)
        self.assertIsNone(Speaker.objects.get(pk=speaker1_los1.pk).weight)
        speaker1_los1.end_speech()
        self.assertIsNotNone(Speaker.objects.get(pk=speaker1_los1.pk).end_time)

    def test_finish_when_other_speaker_begins(self):
        speaker1_los1 = Speaker.objects.add(self.speaker1, self.list_of_speakers_1)
        speaker2_los1 = Speaker.objects.add(self.speaker2, self.list_of_speakers_1)
        speaker1_los1.begin_speech()
        self.assertIsNone(speaker1_los1.end_time)
        self.assertIsNone(speaker2_los1.begin_time)
        speaker2_los1.begin_speech()
        self.assertIsNotNone(
            Speaker.objects.get(
                user=self.speaker1, list_of_speakers=self.list_of_speakers_1
            ).end_time
        )
        self.assertIsNotNone(speaker2_los1.begin_time)
