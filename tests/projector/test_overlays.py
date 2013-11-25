# -*- coding: utf-8 -*-

from mock import MagicMock, patch

from openslides.projector.projector import Overlay
from openslides.utils.test import TestCase


class OverlayTest(TestCase):
    def test_error_in_html(self):
        """
        Tests that the methof get_projector_html does not raise any errors.
        """
        get_projector_html = MagicMock(side_effect=Exception('no good error'))
        overlay = Overlay('test_overlay', lambda: 'widget_html', get_projector_html)

        # Test in productive mode
        with patch('openslides.projector.projector.settings.DEBUG', False):
            self.assertEqual(overlay.get_projector_html(), '')

        # Test in debug mode
        with patch('openslides.projector.projector.settings.DEBUG', True):
            self.assertRaisesMessage(
                Exception,
                'no good error',
                overlay.get_projector_html)
