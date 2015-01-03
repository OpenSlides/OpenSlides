import warnings
from unittest.mock import MagicMock

from openslides.projector.projector import Overlay
from openslides.utils.test import TestCase


class OverlayTest(TestCase):
    def test_error_in_html(self):
        """
        Tests that the method get_projector_html does not raise any errors.
        """
        get_projector_html = MagicMock(side_effect=Exception('no good error'))
        overlay = Overlay('test_overlay', lambda: 'widget_html', get_projector_html)

        with warnings.catch_warnings(record=True) as warning:
            overlay.get_projector_html()
            self.assertEqual(str(warning[0].message), 'Exception in overlay "test_overlay": no good error')
