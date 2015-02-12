from unittest import TestCase
from unittest.mock import patch

from openslides.core import views


class TestUrlPatternsView(TestCase):
    @patch('openslides.core.views.get_resolver')
    def test_get_ajax_context(self, mock_resolver):
        mock_resolver().reverse_dict = {
            'url_pattern1': [[['my_url1']]],
            'url_pattern2': [[['my_url2/%(kwarg)s/']]],
            ('not_a_str', ): [[['not_a_str']]]}
        view = views.UrlPatternsView()

        context = view.get_ajax_context()

        self.assertEqual(
            context,
            {'url_pattern1': 'my_url1',
             'url_pattern2': 'my_url2/:kwarg/'})
