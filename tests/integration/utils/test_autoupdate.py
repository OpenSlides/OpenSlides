from datetime import timedelta
from unittest.mock import patch

from channels import DEFAULT_CHANNEL_LAYER
from channels.asgi import channel_layers
from channels.tests import ChannelTestCase
from django.contrib.auth.models import Group
from django.utils import timezone

from openslides.assignments.models import Assignment
from openslides.core.models import Session
from openslides.topics.models import Topic
from openslides.users.models import User
from openslides.utils.autoupdate import (
    get_logged_in_users,
    inform_changed_data,
    inform_deleted_data,
)
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


@patch('openslides.utils.autoupdate.transaction.on_commit', lambda func: func())
class TestsInformChangedData(ChannelTestCase):
    # on_commit does not work with Djangos TestCase, see:
    # https://docs.djangoproject.com/en/1.10/topics/db/transactions/#use-in-tests
    # In this case it is also not possible to use a TransactionTestCase because
    # we have to use the ChannelTestCase.
    # The patch in the class decorator changes on_commit, so the given callable
    # is called immediately. This is the same behavior as if there would be
    # no transaction at all.

    def test_change_one_element(self):
        topic = Topic.objects.create(title='test_topic')
        channel_layers[DEFAULT_CHANNEL_LAYER].flush()

        inform_changed_data(topic)

        channel_message = self.get_next_message('autoupdate.send_data', require=True)
        self.assertEqual(len(channel_message['elements']), 1)
        self.assertEqual(
            channel_message['elements'][0]['collection_string'],
            'topics/topic')

    def test_change_many_elements(self):
        topics = (
            Topic.objects.create(title='test_topic1'),
            Topic.objects.create(title='test_topic2'),
            Topic.objects.create(title='test_topic3'))
        channel_layers[DEFAULT_CHANNEL_LAYER].flush()

        inform_changed_data(topics)

        channel_message = self.get_next_message('autoupdate.send_data', require=True)
        self.assertEqual(len(channel_message['elements']), 3)

    def test_change_with_non_root_rest_elements(self):
        """
        Tests that if an root_rest_element is called together with one of its
        child elements, then there is only the root_rest_element in the channel
        message.
        """
        assignment = Assignment.objects.create(title='test_assignment', open_posts=1)
        poll = assignment.create_poll()
        channel_layers[DEFAULT_CHANNEL_LAYER].flush()

        inform_changed_data((assignment, poll))

        channel_message = self.get_next_message('autoupdate.send_data', require=True)
        self.assertEqual(len(channel_message['elements']), 1)

    def test_change_only_non_root_rest_element(self):
        """
        Tests that if only a non root_rest_element is called, then only the
        root_rest_element is in the channel.
        """
        assignment = Assignment.objects.create(title='test_assignment', open_posts=1)
        poll = assignment.create_poll()
        channel_layers[DEFAULT_CHANNEL_LAYER].flush()

        inform_changed_data(poll)

        channel_message = self.get_next_message('autoupdate.send_data', require=True)
        self.assertEqual(len(channel_message['elements']), 1)

    def test_change_no_autoupdate_model(self):
        """
        Tests that if inform_changed_data() is called with a model that does
        not support autoupdate, nothing happens.
        """
        group = Group.objects.create(name='test_group')
        channel_layers[DEFAULT_CHANNEL_LAYER].flush()

        inform_changed_data(group)

        with self.assertRaises(AssertionError):
            # self.get_next_message() with require=True raises a AssertionError
            # if there is no message in the channel
            self.get_next_message('autoupdate.send_data', require=True)

    def test_delete_one_element(self):
        channel_layers[DEFAULT_CHANNEL_LAYER].flush()

        inform_deleted_data('topics/topic', 1)

        channel_message = self.get_next_message('autoupdate.send_data', require=True)
        self.assertEqual(len(channel_message['elements']), 1)
        self.assertTrue(channel_message['elements'][0]['deleted'])

    def test_delete_many_elements(self):
        channel_layers[DEFAULT_CHANNEL_LAYER].flush()

        inform_deleted_data('topics/topic', 1, 'topics/topic', 2, 'testmodule/model', 1)

        channel_message = self.get_next_message('autoupdate.send_data', require=True)
        self.assertEqual(len(channel_message['elements']), 3)

    def test_delete_no_element(self):
        with self.assertRaises(ValueError):
            inform_deleted_data()

    def test_delete_wrong_arguments(self):
        with self.assertRaises(ValueError):
            inform_deleted_data('testmodule/model')

        with self.assertRaises(ValueError):
            inform_deleted_data('testmodule/model', 5, 'testmodule/model')
