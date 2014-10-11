from unittest.mock import patch, MagicMock

from django.contrib.auth.models import Permission
from django.test.client import Client

from openslides.agenda.models import Item, Speaker
from openslides.agenda.signals import agenda_list_of_speakers
from openslides.config.api import config
from openslides.users.models import User
from openslides.projector.api import set_active_slide, register_slide_model
from openslides.utils.exceptions import OpenSlidesError
from openslides.utils.test import TestCase

from .models import RelatedItem


class ListOfSpeakerModelTests(TestCase):
    def setUp(self):
        self.item1 = Item.objects.create(title='item1')
        self.item2 = Item.objects.create(title='item2')
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
        speaker1_item1.begin_speach()
        self.assertIsNotNone(Speaker.objects.get(pk=speaker1_item1.pk).begin_time)
        self.assertIsNone(Speaker.objects.get(pk=speaker1_item1.pk).weight)
        speaker1_item1.end_speach()
        self.assertIsNotNone(Speaker.objects.get(pk=speaker1_item1.pk).end_time)

    def test_finish_when_other_speaker_begins(self):
        speaker1_item1 = Speaker.objects.add(self.speaker1, self.item1)
        speaker2_item1 = Speaker.objects.add(self.speaker2, self.item1)
        speaker1_item1.begin_speach()
        self.assertIsNone(speaker1_item1.end_time)
        self.assertIsNone(speaker2_item1.begin_time)
        speaker2_item1.begin_speach()
        self.assertIsNotNone(Speaker.objects.get(user=self.speaker1, item=self.item1).end_time)
        self.assertIsNotNone(speaker2_item1.begin_time)

    @patch('openslides.agenda.models.update_projector_overlay')
    def test_speach_coupled_with_countdown(self, mock_update_projector_overlay):
        config['agenda_couple_countdown_and_speakers'] = True
        speaker1_item1 = Speaker.objects.add(self.speaker1, self.item1)
        self.item1.is_active_slide = MagicMock(return_value=True)

        speaker1_item1.begin_speach()
        self.assertEqual(config['countdown_state'], 'active')
        mock_update_projector_overlay.assert_called_with('projector_countdown')

        mock_update_projector_overlay.reset_mock()
        speaker1_item1.end_speach()
        self.assertEqual(config['countdown_state'], 'paused')
        mock_update_projector_overlay.assert_called_with('projector_countdown')

    @patch('openslides.agenda.models.update_projector_overlay')
    def test_begin_speach_not_coupled_with_countdown(self, mock_update_projector_overlay):
        config['agenda_couple_countdown_and_speakers'] = False
        speaker1_item1 = Speaker.objects.add(self.speaker1, self.item1)

        speaker1_item1.begin_speach()
        self.assertEqual(config['countdown_state'], 'inactive')

        config['countdown_state'] = 'active'
        speaker1_item1.end_speach()
        self.assertEqual(config['countdown_state'], 'active')
        self.assertFalse(mock_update_projector_overlay.called)


class SpeakerViewTestCase(TestCase):
    def setUp(self):
        # Admin
        self.admin = User.objects.get(pk=1)
        self.admin_client = Client()
        self.admin_client.login(username='admin', password='admin')

        # Speaker1
        self.speaker1 = User.objects.create_user('speaker1', 'speaker')
        self.speaker1_client = Client()
        self.speaker1_client.login(username='speaker1', password='speaker')

        # Speaker2
        self.speaker2 = User.objects.create_user('speaker2', 'speaker')
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
        self.assertFalse(Speaker.objects.filter(user=self.speaker1, item=self.item1).exists())
        self.assertEqual(Speaker.objects.filter(item=self.item1).count(), 0)

        # Set speaker1 to item1
        response = self.check_url('/agenda/1/speaker/', self.speaker1_client, 302)
        self.assertTrue(Speaker.objects.filter(user=self.speaker1, item=self.item1).exists())
        self.assertEqual(Speaker.objects.filter(item=self.item1).count(), 1)
        self.assertMessage(response, 'You were successfully added to the list of speakers.')

        # Try to set speaker 1 to item 1 again
        response = self.check_url('/agenda/1/speaker/', self.speaker1_client, 302)
        self.assertEqual(Speaker.objects.filter(item=self.item1).count(), 1)
        self.assertMessage(response, 'speaker1 is already on the list of speakers of item 1.')

    def test_closed_list(self):
        self.item1.speaker_list_closed = True
        self.item1.save()

        response = self.check_url('/agenda/1/speaker/', self.speaker1_client, 302)
        self.assertEqual(Speaker.objects.filter(item=self.item1).count(), 0)
        self.assertMessage(response, 'The list of speakers is closed.')


class TestAgendaItemView(SpeakerViewTestCase):
    def test_post(self):
        # Set speaker1 to item1
        response = self.admin_client.post(
            '/agenda/1/', {'speaker': self.speaker1.id})
        self.assertTrue(Speaker.objects.filter(user=self.speaker1, item=self.item1).exists())

        # Try it again
        response = self.admin_client.post(
            '/agenda/1/', {'speaker': self.speaker1.id})
        self.assertFormError(response, 'form', 'speaker', 'speaker1 is already on the list of speakers.')


class TestSpeakerDeleteView(SpeakerViewTestCase):
    def test_get(self):
        self.check_url('/agenda/1/speaker/del/', self.speaker1_client, 302)

    def test_post_as_admin(self):
        speaker = Speaker.objects.add(self.speaker1, self.item1)

        response = self.admin_client.post(
            '/agenda/1/speaker/%d/del/' % speaker.pk, {'yes': 'yes'})
        self.assertEqual(response.status_code, 302)
        self.assertFalse(Speaker.objects.filter(user=self.speaker1, item=self.item1).exists())

    def test_post_as_user(self):
        Speaker.objects.add(self.speaker1, self.item1)

        response = self.speaker1_client.post(
            '/agenda/1/speaker/del/', {'yes': 'yes'})
        self.assertEqual(response.status_code, 302)
        self.assertFalse(Speaker.objects.filter(user=self.speaker1, item=self.item1).exists())


class TestSpeakerSpeakView(SpeakerViewTestCase):
    def test_get(self):
        url = '/agenda/1/speaker/%s/speak/' % self.speaker1.pk
        response = self.check_url(url, self.admin_client, 302)
        self.assertMessage(response, '2 is not on the list of item1.')

        speaker = Speaker.objects.add(self.speaker1, self.item1)
        response = self.check_url(url, self.admin_client, 302)
        speaker = Speaker.objects.get(pk=speaker.pk)
        self.assertIsNotNone(speaker.begin_time)
        self.assertIsNone(speaker.weight)


class TestSpeakerEndSpeachView(SpeakerViewTestCase):
    def test_get(self):
        url = '/agenda/1/speaker/end_speach/'
        response = self.check_url(url, self.admin_client, 302)
        self.assertMessage(response, 'There is no one speaking at the moment according to item1.')
        speaker = Speaker.objects.add(self.speaker1, self.item1)
        speaker.begin_speach()
        response = self.check_url(url, self.admin_client, 302)
        speaker = Speaker.objects.get(pk=speaker.pk)
        self.assertIsNotNone(speaker.begin_time)
        self.assertIsNotNone(speaker.end_time)
        self.assertIsNone(speaker.weight)


class SpeakerListOpenView(SpeakerViewTestCase):
    def test_get(self):
        self.check_url('/agenda/1/speaker/close/', self.admin_client, 302)
        item = Item.objects.get(pk=self.item1.pk)
        self.assertTrue(item.speaker_list_closed)

        self.check_url('/agenda/1/speaker/reopen/', self.admin_client, 302)
        item = Item.objects.get(pk=self.item1.pk)
        self.assertFalse(item.speaker_list_closed)


class GlobalListOfSpeakersLinks(SpeakerViewTestCase):
    def test_global_redirect_url(self):
        response = self.speaker1_client.get('/agenda/list_of_speakers/')
        self.assertRedirects(response, '/dashboard/')
        self.assertMessage(response, 'There is no list of speakers for the current slide. Please choose the agenda item manually from the agenda.')

        set_active_slide('agenda', pk=1)
        response = self.speaker1_client.get('/agenda/list_of_speakers/')
        self.assertRedirects(response, '/agenda/1/')

    def test_global_add_url(self):
        response = self.speaker1_client.get('/agenda/list_of_speakers/add/')
        self.assertRedirects(response, '/dashboard/')
        self.assertMessage(response, 'There is no list of speakers for the current slide. Please choose the agenda item manually from the agenda.')

        set_active_slide('agenda', pk=1)
        response = self.speaker1_client.get('/agenda/list_of_speakers/add/')
        self.assertRedirects(response, '/agenda/1/')
        self.assertEqual(Speaker.objects.get(item__pk='1').user, self.speaker1)
        self.assertMessage(response, 'You were successfully added to the list of speakers.')

        perm = Permission.objects.filter(name='Can see agenda').get()
        self.speaker2.groups.get(name='Registered').permissions.remove(perm)
        response = self.speaker2_client.get('/agenda/list_of_speakers/add/')
        self.assertMessage(response, 'You were successfully added to the list of speakers.')

    @patch('openslides.projector.api.slide_callback', {})
    @patch('openslides.projector.api.slide_model', {})
    def test_next_speaker_on_related_item(self):
        """
        Test to add a speaker on a related item.

        The patching of slide_callback and slide_model is needed to cleanup the
        call of register_slide_model after the test is run.
        """
        register_slide_model(RelatedItem, 'some/template.html')
        related_item = RelatedItem.objects.create()
        agenda_item = Item.objects.create(content_object=related_item)
        config['projector_active_slide'] = {'callback': 'test_related_item', 'pk': 1}
        response = self.speaker1_client.get('/agenda/list_of_speakers/add/')

        self.assertRedirects(response, '/agenda/%d/' % agenda_item.pk)
        self.assertEqual(Speaker.objects.get(item__pk=agenda_item.pk).user, self.speaker1)
        self.assertMessage(response, 'You were successfully added to the list of speakers.')

    def test_global_next_speaker_url(self):
        response = self.admin_client.get('/agenda/list_of_speakers/next/')
        self.assertRedirects(response, '/dashboard/')
        self.assertMessage(response, 'There is no list of speakers for the current slide. Please choose the agenda item manually from the agenda.')

        set_active_slide('agenda', pk=1)
        response = self.admin_client.get('/agenda/list_of_speakers/next/')
        self.assertRedirects(response, '/dashboard/')
        self.assertMessage(response, 'The list of speakers is empty.')

        response = self.speaker1_client.get('/agenda/list_of_speakers/add/')
        self.assertTrue(Speaker.objects.get(item__pk='1').begin_time is None)
        response = self.admin_client.get('/agenda/list_of_speakers/next/')
        self.assertRedirects(response, '/dashboard/')
        self.assertTrue(Speaker.objects.get(item__pk='1').begin_time is not None)

    def test_global_end_speach_url(self):
        response = self.admin_client.get('/agenda/list_of_speakers/end_speach/')
        self.assertRedirects(response, '/dashboard/')
        self.assertMessage(response, 'There is no list of speakers for the current slide. Please choose the agenda item manually from the agenda.')

        set_active_slide('agenda', pk=1)
        response = self.admin_client.get('/agenda/list_of_speakers/end_speach/')
        self.assertRedirects(response, '/dashboard/')
        self.assertMessage(response, 'There is no one speaking at the moment.')

        response = self.speaker1_client.get('/agenda/list_of_speakers/add/')
        self.assertTrue(Speaker.objects.get(item__pk='1').begin_time is None)
        response = self.admin_client.get('/agenda/list_of_speakers/end_speach/')
        self.assertRedirects(response, '/dashboard/')
        self.assertMessage(response, 'There is no one speaking at the moment.')

        response = self.admin_client.get('/agenda/list_of_speakers/next/')
        self.assertTrue(Speaker.objects.get(item__pk='1').end_time is None)
        response = self.admin_client.get('/agenda/list_of_speakers/end_speach/')
        self.assertRedirects(response, '/dashboard/')
        self.assertTrue(Speaker.objects.get(item__pk='1').end_time is not None)


class TestOverlay(TestCase):
    def test_overlay_with_no_model_slide(self):
        """
        When a slide is active, that is not a model (for example the agenda)
        an Attribute Error was raised.
        """
        config['projector_active_slide'] = {'callback': None}

        value = agenda_list_of_speakers(sender='test').get_projector_html()

        self.assertEqual(value, '')


class TestCurrentListOfSpeakersOnProjectorView(SpeakerViewTestCase):
    """
    Test the view with the current list of speakers depending on the actual
    slide.
    """
    def test_get_none(self):
        response = self.admin_client.get('/agenda/list_of_speakers/projector/')
        self.assertContains(response, 'List of speakers</h1><i>Not available')

    def test_get_normal(self):
        self.item1.title = 'title_gupooDee8ahahnaxoo2a'
        self.item1.save()
        Speaker.objects.add(self.speaker1, self.item1)
        config['projector_active_slide'] = {'callback': 'agenda', 'pk': self.item1.pk}
        response = self.admin_client.get('/agenda/list_of_speakers/projector/')
        self.assertContains(response, 'List of speakers')
        self.assertContains(response, 'title_gupooDee8ahahnaxoo2a')
        self.assertContains(response, 'speaker1')
