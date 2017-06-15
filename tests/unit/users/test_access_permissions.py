from unittest import TestCase

from openslides.users.access_permissions import UserAccessPermissions
from openslides.utils.collection import CollectionElement


class UserGetProjectorDataTest(TestCase):
    def test_get_projector_data_with_collection(self):
        """
        This test ensures that comment field is removed.
        """
        container = CollectionElement.from_values('users/user', 42, full_data={
            'id': 42,
            'username': 'username_ai3Oofu7eit0eeyu1sie',
            'title': '',
            'first_name': 'first_name_iu8toShae0oolie8aevo',
            'last_name': 'last_name_OhZ4beezohY0doNoh2th',
            'structure_level': '',
            'number': '',
            'about_me': '',
            'groups_id': [],
            'is_present': False,
            'is_committee': False,
            'comment': 'comment_gah7aipeJohv9xethoku',
        })
        data = UserAccessPermissions().get_projector_data(container)
        self.assertEqual(data, {
            'id': 42,
            'username': 'username_ai3Oofu7eit0eeyu1sie',
            'title': '',
            'first_name': 'first_name_iu8toShae0oolie8aevo',
            'last_name': 'last_name_OhZ4beezohY0doNoh2th',
            'structure_level': '',
            'number': '',
            'about_me': '',
            'groups_id': [],
            'is_present': False,
            'is_committee': False,
        })
