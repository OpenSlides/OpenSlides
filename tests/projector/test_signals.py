from openslides.projector.signals import countdown
from openslides.utils.test import TestCase


class CountdownTest(TestCase):
    def test_order_of_get_projector_js(self):
        """
        Tests that the order of the js values is in the right order. Especially
        the value 'call' has to come at the end.
        """
        overlay = countdown('fake sender')
        test_value = overlay.get_javascript()

        self.assertIsInstance(test_value, dict)
        self.assertEqual(
            list(test_value.keys()),
            ['load_file', 'projector_countdown_start',
             'projector_countdown_duration', 'projector_countdown_pause',
             'projector_countdown_state', 'call'])
