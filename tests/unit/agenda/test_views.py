from unittest import TestCase
from unittest.mock import MagicMock, patch

from openslides.agenda.views import ListOfSpeakersViewSet


class ListOfSpeakersViewSetManageSpeaker(TestCase):
    """
    Tests views of ListOfSpeakersViewSet to manage speakers.
    """

    def setUp(self):
        self.request = MagicMock()
        self.view_instance = ListOfSpeakersViewSet()
        self.view_instance.request = self.request
        self.view_instance.get_object = get_object_mock = MagicMock()
        get_object_mock.return_value = self.mock_list_of_speakers = MagicMock()

    @patch("openslides.agenda.views.inform_changed_data")
    @patch("openslides.agenda.views.has_perm")
    @patch("openslides.agenda.views.Speaker")
    def test_add_oneself_as_speaker(self, mock_speaker, mock_has_perm, mock_icd):
        self.request.method = "POST"
        self.request.user = 1
        mock_has_perm.return_value = True
        self.request.data = {}
        self.mock_list_of_speakers.closed = False

        self.view_instance.manage_speaker(self.request)

        mock_speaker.objects.add.assert_called_with(
            self.request.user, self.mock_list_of_speakers
        )

    @patch("openslides.agenda.views.inform_changed_data")
    @patch("openslides.agenda.views.has_perm")
    @patch("openslides.agenda.views.get_user_model")
    @patch("openslides.agenda.views.Speaker")
    def test_add_someone_else_as_speaker(
        self, mock_speaker, mock_get_user_model, mock_has_perm, mock_icd
    ):
        self.request.method = "POST"
        self.request.user = 1
        self.request.data = {
            "user": "2"
        }  # It is assumed that the request user has pk!=2.
        mock_get_user_model.return_value = MockUser = MagicMock()
        MockUser.objects.get.return_value = mock_user = MagicMock()
        mock_has_perm.return_value = True

        self.view_instance.manage_speaker(self.request)

        MockUser.objects.get.assert_called_with(pk=2)
        mock_speaker.objects.add.assert_called_with(
            mock_user, self.mock_list_of_speakers
        )

    @patch("openslides.agenda.views.Speaker")
    def test_remove_oneself(self, mock_speaker):
        self.request.method = "DELETE"
        self.request.data = {}
        self.view_instance.manage_speaker(self.request)
        mock_queryset = mock_speaker.objects.filter.return_value.exclude.return_value
        mock_queryset.get.return_value.delete.assert_called_with()

    @patch("openslides.agenda.views.inform_changed_data")
    @patch("openslides.agenda.views.has_perm")
    @patch("openslides.agenda.views.Speaker")
    def test_remove_someone_else(
        self, mock_speaker, mock_has_perm, mock_inform_changed_data
    ):
        self.request.method = "DELETE"
        self.request.user = 1
        self.request.data = {"speaker": "1"}
        mock_has_perm.return_value = True

        self.view_instance.manage_speaker(self.request)

        mock_speaker.objects.get.assert_called_with(pk=1)
        mock_speaker.objects.get.return_value.delete.assert_called_with(
            skip_autoupdate=True
        )
        mock_inform_changed_data.assert_called_with(self.mock_list_of_speakers)


class ListOfSpeakersViewSetSpeak(TestCase):
    """
    Tests views of ListOfSpeakersViewSet to begin and end speech.
    """

    def setUp(self):
        self.request = MagicMock()
        self.view_instance = ListOfSpeakersViewSet()
        self.view_instance.request = self.request
        self.view_instance.get_object = get_object_mock = MagicMock()
        get_object_mock.return_value = self.mock_list_of_speakers = MagicMock()

    def test_begin_speech(self):
        self.request.method = "PUT"
        self.request.user.has_perm.return_value = True
        self.request.data = {}
        self.mock_list_of_speakers.get_next_speaker.return_value = (
            mock_next_speaker
        ) = MagicMock()
        self.view_instance.speak(self.request)
        mock_next_speaker.begin_speech.assert_called_with()

    @patch("openslides.agenda.views.Speaker")
    def test_begin_speech_specific_speaker(self, mock_speaker):
        self.request.method = "PUT"
        self.request.user.has_perm.return_value = True
        self.request.data = {"speaker": "1"}
        mock_speaker.objects.get.return_value = mock_next_speaker = MagicMock()
        self.view_instance.speak(self.request)
        mock_next_speaker.begin_speech.assert_called_with()

    @patch("openslides.agenda.views.Speaker")
    def test_end_speech(self, mock_speaker):
        self.request.method = "DELETE"
        self.request.user.has_perm.return_value = True
        mock_speaker.objects.filter.return_value.exclude.return_value.get.return_value = (
            mock_speaker
        ) = MagicMock()
        self.view_instance.speak(self.request)
        mock_speaker.end_speech.assert_called_with()
