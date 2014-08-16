from io import StringIO
from unittest.mock import MagicMock, patch

from openslides import get_git_commit_id, get_version
from openslides.utils.test import TestCase


class InitTest(TestCase):
    def test_get_version(self):
        """
        Tests the method during development process and for releases.
        """
        self.assertEqual(get_version(version=(1, 3, 0, 'beta', 2), release=False), '1.3b2-dev')
        self.assertEqual(get_version(version=(1, 0, 0, 'final', 0), release=False), '1.0-dev')
        self.assertEqual(get_version(version=(2, 5, 3, 'alpha', 0), release=False), '2.5.3a0-dev')
        self.assertEqual(get_version(version=(1, 3, 0, 'beta', 2), release=True), '1.3b2')
        self.assertEqual(get_version(version=(1, 0, 0, 'final', 0), release=True), '1.0')
        self.assertEqual(get_version(version=(2, 5, 3, 'alpha', 0), release=True), '2.5.3a0')
        self.assertEqual(get_version(version=(2, 5, 3, 'final', 0), release=True), '2.5.3')

    @patch('builtins.open', MagicMock(side_effect=IOError))
    def test_get_commit_id_unknown(self):
        """
        Tests unknown git commit id.
        """
        self.assertEqual(get_git_commit_id(), 'unknown')

    @patch('builtins.open')
    def test_get_commit_id_without_ref(self, mock):
        """
        Tests reading the content of the git_commit_id file.
        """
        mock.return_value = StringIO('test_id_ahyuGo7yefai7Nai')
        self.assertEqual(get_git_commit_id(), 'test_id_ahyuGo7yefai7Nai')

    @patch('builtins.open')
    def test_get_git_commit_id_general(self, mock):
        """
        Tests reading the content of a git reference (e.g. tags or branches).
        """
        mock.side_effect = (StringIO('ref: asdfgqwertfdfhiwer'), StringIO('TestOpenSlides-3.1415'))
        git_commit_id = get_git_commit_id()
        if not git_commit_id == 'unknown':
            self.assertEqual(git_commit_id, 'TestOpenSlides-3.1415')
