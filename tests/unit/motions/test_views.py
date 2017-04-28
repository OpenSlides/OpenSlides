from unittest import TestCase
from unittest.mock import MagicMock, patch

from openslides.motions.views import MotionViewSet


class MotionViewSetCreate(TestCase):
    """
    Tests create view of MotionViewSet.
    """
    def setUp(self):
        self.request = MagicMock()
        self.request.data.get.return_value = None
        self.view_instance = MotionViewSet()
        self.view_instance.request = self.request
        self.view_instance.format_kwarg = MagicMock()
        self.view_instance.get_serializer = get_serializer_mock = MagicMock()
        get_serializer_mock.return_value = self.mock_serializer = MagicMock()

    @patch('openslides.motions.views.inform_changed_data')
    @patch('openslides.motions.views.has_perm')
    @patch('openslides.motions.views.config')
    def test_simple_create(self, mock_config, mock_has_perm, mock_icd):
        self.request.user = 1
        mock_has_perm.return_value = True

        self.view_instance.create(self.request)

        self.mock_serializer.save.assert_called_with(request_user=self.request.user)


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

    @patch('openslides.motions.views.inform_changed_data')
    @patch('openslides.motions.views.has_perm')
    @patch('openslides.motions.views.config')
    def test_simple_update(self, mock_config, mock_has_perm, mock_icd):
        self.request.user = 1
        self.request.data.get.return_value = versioning_mock = MagicMock()
        mock_has_perm.return_value = True

        self.view_instance.update(self.request)

        self.mock_serializer.save.assert_called_with(disable_versioning=versioning_mock)


class MotionViewSetManageVersion(TestCase):
    """
    Tests views of MotionViewSet to manage versions.
    """
    def setUp(self):
        self.request = MagicMock()
        self.view_instance = MotionViewSet()
        self.view_instance.request = self.request
        self.view_instance.get_object = get_object_mock = MagicMock()
        get_object_mock.return_value = self.mock_motion = MagicMock()

    def test_activate_version(self):
        self.request.method = 'PUT'
        self.request.user.has_perm.return_value = True
        self.view_instance.manage_version(self.request)
        self.mock_motion.save.assert_called_with(update_fields=['active_version'])

    def test_delete_version(self):
        self.request.method = 'DELETE'
        self.request.user.has_perm.return_value = True
        self.view_instance.manage_version(self.request)
        self.mock_motion.versions.get.return_value.delete.assert_called_with()
