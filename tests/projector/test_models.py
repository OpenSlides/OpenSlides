from mock import patch

from openslides.config.api import config
from openslides.utils.test import TestCase

from .models import DummySlideMixinModel


class TestSlideMixin(TestCase):
    @patch('openslides.projector.api.update_projector')
    def test_delete(self, mock_update_projector):
        obj = DummySlideMixinModel.objects.create(title='title_cah4AhZai3einoh9koo3')
        config['projector_active_slide'] = {
            'callback': 'dummy_slides_mixin_model_geu3AiceeG9eo6ohChoD',
            'pk': '1'}
        obj.delete()
        mock_update_projector.assert_called_with()
