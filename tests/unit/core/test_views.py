from unittest import TestCase
from unittest.mock import MagicMock, patch

from openslides.core import views
from openslides.utils.rest_api import ValidationError


@patch("openslides.core.views.ProjectorViewSet.get_object")
class ProjectorAPI(TestCase):
    def setUp(self):
        self.viewset = views.ProjectorViewSet()
        self.viewset.format_kwarg = None

    def test_activate_elements_no_list(self, mock_object):
        mock_object.return_value.config = {
            "3979c9fc3bee432fb25f354d6b4868b3": {
                "name": "test_projector_element_ahshaiTie8xie3eeThu9",
                "test_key_ohwa7ooze2angoogieM9": "test_value_raiL2ohsheij1seiqua5",
            }
        }
        request = MagicMock()
        request.data = {"name": "new_test_projector_element_buuDohphahWeeR2eeQu0"}
        self.viewset.request = request
        with self.assertRaises(ValidationError):
            self.viewset.activate_elements(request=request, pk=MagicMock())

    def test_activate_elements_bad_element(self, mock_object):
        mock_object.return_value.config = {
            "374000ee236a41e09cce22ffad29b455": {
                "name": "test_projector_element_ieroa7eu3aechaip3eeD",
                "test_key_mie3Eeroh9rooKeinga6": "test_value_gee1Uitae6aithaiphoo",
            }
        }
        request = MagicMock()
        request.data = [{"bad_quangah1ahoo6oKaeBai": "value_doh8ahwe0Zooc1eefu0o"}]
        self.viewset.request = request
        with self.assertRaises(ValidationError):
            self.viewset.activate_elements(request=request, pk=MagicMock())
