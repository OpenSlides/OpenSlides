from unittest import TestCase

from openslides.users.access_permissions import PersonalNoteAccessPermissions
from openslides.utils.collection import CollectionElement


class TestPersonalNoteAccessPermissions(TestCase):
    def test_get_restricted_data(self):
        ap = PersonalNoteAccessPermissions()
        rd = ap.get_restricted_data(
            [{'user_id': 1}],
            CollectionElement.from_values('users/user', 5, full_data={}))
        self.assertEqual(rd, [])

    def test_get_restricted_data_for_anonymous(self):
        ap = PersonalNoteAccessPermissions()
        rd = ap.get_restricted_data(
            [{'user_id': 1}],
            None)
        self.assertEqual(rd, [])
