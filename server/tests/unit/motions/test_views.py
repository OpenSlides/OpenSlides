from unittest import TestCase
from unittest.mock import MagicMock, patch

from openslides.motions.views import MotionViewSet


class MotionViewSetUpdate(TestCase):
    """
    Tests update view of MotionViewSet.
    """

    def setUp(self):
        self.request = MagicMock()
        self.view_instance = MotionViewSet()
        self.view_instance.request = self.request
        self.view_instance.kwargs = MagicMock()
        self.view_instance.get_object = MagicMock()
        self.view_instance.get_serializer = get_serializer_mock = MagicMock()
        get_serializer_mock.return_value = self.mock_serializer = MagicMock()

    @patch("openslides.motions.views.inform_changed_data")
    @patch("openslides.motions.views.has_perm")
    @patch("openslides.motions.views.config")
    def test_simple_update(self, mock_config, mock_has_perm, mock_icd):
        self.request.user = MagicMock()
        self.request.user.pk = 1
        self.request.data.get.return_value = MagicMock()
        mock_has_perm.return_value = True

        self.view_instance.update(self.request)

        self.mock_serializer.save.assert_called()
