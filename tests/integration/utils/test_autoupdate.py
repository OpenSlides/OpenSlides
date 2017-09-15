from unittest.mock import patch

from channels import DEFAULT_CHANNEL_LAYER
from channels.asgi import channel_layers
from channels.tests import ChannelTestCase
from django.contrib.auth.models import Group

from openslides.assignments.models import Assignment
from openslides.topics.models import Topic
from openslides.utils.autoupdate import (
    inform_changed_data,
    inform_deleted_data,
)


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
        not support autoupdate, nothing happens. We use the django Group for
        this (not the OpenSlides Group)
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

        inform_deleted_data([('topics/topic', 1)])

        channel_message = self.get_next_message('autoupdate.send_data', require=True)
        self.assertEqual(len(channel_message['elements']), 1)
        self.assertTrue(channel_message['elements'][0]['deleted'])

    def test_delete_many_elements(self):
        channel_layers[DEFAULT_CHANNEL_LAYER].flush()

        inform_deleted_data([('topics/topic', 1), ('topics/topic', 2), ('testmodule/model', 1)])

        channel_message = self.get_next_message('autoupdate.send_data', require=True)
        self.assertEqual(len(channel_message['elements']), 3)
