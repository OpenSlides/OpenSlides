from datetime import timedelta

from django.utils import timezone

from openslides.core.models import Session
from openslides.users.models import User
from openslides.utils.autoupdate import get_logged_in_users
from openslides.utils.test import TestCase


class TestGetLoggedInUsers(TestCase):
    def test_call(self):
        """
        Test to call the function with:
        * A user that session has not expired
        * A user that session has expired
        * A user that has no session
        * An anonymous user that session hot not expired

        Only the user with the session that has not expired should be returned
        """
        user1 = User.objects.create(username='user1')
        user2 = User.objects.create(username='user2')
        User.objects.create(username='user3')

        # Create a session with a user, that expires in 5 hours
        Session.objects.create(
            user=user1,
            expire_date=timezone.now() + timedelta(hours=5),
            session_key='1')

        # Create a session with a user, that is expired before 5 hours
        Session.objects.create(
            user=user2,
            expire_date=timezone.now() + timedelta(hours=-5),
            session_key='2')

        # Create a session with an anonymous user, that expires in 5 hours
        Session.objects.create(
            user=None,
            expire_date=timezone.now() + timedelta(hours=5),
            session_key='3')

        self.assertEqual(list(get_logged_in_users()), [user1])

    def test_unique(self):
        """
        Test the function with a user that has two not expired session.
        The user should be returned only once.
        """
        user1 = User.objects.create(username='user1')
        Session.objects.create(
            user=user1,
            expire_date=timezone.now() + timedelta(hours=1),
            session_key='1')
        Session.objects.create(
            user=user1,
            expire_date=timezone.now() + timedelta(hours=2),
            session_key='2')

        self.assertEqual(list(get_logged_in_users()), [user1])
