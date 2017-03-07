import json
import time
import warnings
from collections import Iterable

from channels import Channel, Group
from channels.asgi import get_channel_layer
from channels.auth import channel_session_user, channel_session_user_from_http
from django.apps import apps
from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction

from ..core.config import config
from ..core.models import Projector
from .auth import has_perm, user_to_collection_user
from .cache import websocket_user_cache
from .collection import Collection, CollectionElement, CollectionElementList


def send_or_wait(send_func, *args, **kwargs):
    """
    Wrapper for channels' send() method.

    If the method send() raises ChannelFull exception the worker waits for 20
    milliseconds and tries again. After 5 secondes it gives up, drops the
    channel message and writes a warning to stderr.

    Django channels' consumer atomicity feature is disabled.
    """
    kwargs['immediately'] = True
    for i in range(250):
        try:
            send_func(*args, **kwargs)
        except get_channel_layer().ChannelFull:
            time.sleep(0.02)
        else:
            break
    else:
        warnings.warn(
            'Channel layer is full. Channel message dropped.',
            RuntimeWarning
        )


@channel_session_user_from_http
def ws_add_site(message):
    """
    Adds the websocket connection to a group specific to the connecting user.

    The group with the name 'user-None' stands for all anonymous users.

    Send all "startup-data" through the connection.
    """
    Group('site').add(message.reply_channel)
    message.channel_session['user_id'] = message.user.id
    # Saves the reply channel to the user. Uses 0 for anonymous users.
    websocket_user_cache.add(message.user.id or 0, message.reply_channel.name)

    # Collect all elements that shoud be send to the client when the websocket
    # connection is established
    output = []
    for app in apps.get_app_configs():
        try:
            # Get the method get_startup_elements() from an app.
            # This method has to return an iterable of Collection objects.
            get_startup_elements = app.get_startup_elements
        except AttributeError:
            # Skip apps that do not implement get_startup_elements
            continue
        for collection in get_startup_elements():
            user = user_to_collection_user(message.user.id)
            output.extend(collection.as_autoupdate_for_user(user))

    # Send all data. If there is no data, then only accept the connection
    if output:
        send_or_wait(message.reply_channel.send, {'text': json.dumps(output)})
    else:
        send_or_wait(message.reply_channel.send, {'accept': True})


@channel_session_user
def ws_disconnect_site(message):
    """
    This function is called, when a client on the site disconnects.
    """
    Group('site').discard(message.reply_channel)
    websocket_user_cache.remove(message.user.id or 0, message.reply_channel.name)


@channel_session_user_from_http
def ws_add_projector(message, projector_id):
    """
    Adds the websocket connection to a group specific to the projector with the given id.
    Also sends all data that are shown on the projector.
    """
    user = message.user.id

    if not has_perm(user, 'core.can_see_projector'):
        send_or_wait(message.reply_channel.send, {'text': 'No permissions to see this projector.'})
    else:
        try:
            projector = Projector.objects.get(pk=projector_id)
        except Projector.DoesNotExist:
            send_or_wait(message.reply_channel.send, {'text': 'The projector {} does not exist.'.format(projector_id)})
        else:
            # At first, the client is added to the projector group, so it is
            # informed if the data change.
            Group('projector-{}'.format(projector_id)).add(message.reply_channel)

            # Then it is also added to the global projector group which is
            # used for broadcasting data.
            Group('projector-all').add(message.reply_channel)

            # Now check whether broadcast is active at the moment. If yes,
            # change the local projector variable.
            if config['projector_broadcast'] > 0:
                projector = Projector.objects.get(pk=config['projector_broadcast'])

            # Collect all elements that are on the projector.
            output = []
            for requirement in projector.get_all_requirements():
                required_collection_element = CollectionElement.from_instance(requirement)
                output.append(required_collection_element.as_autoupdate_for_projector())

            # Collect all config elements.
            collection = Collection(config.get_collection_string())
            output.extend(collection.as_autoupdate_for_projector())

            # Collect the projector instance.
            collection_element = CollectionElement.from_instance(projector)
            output.append(collection_element.as_autoupdate_for_projector())

            # Send all the data that were only collected before.
            send_or_wait(message.reply_channel.send, {'text': json.dumps(output)})


def ws_disconnect_projector(message, projector_id):
    """
    This function is called, when a client on the projector disconnects.
    """
    Group('projector-{}'.format(projector_id)).discard(message.reply_channel)


def send_data(message):
    """
    Informs all site users and projector clients about changed data.
    """
    collection_elements = CollectionElementList.from_channels_message(message)

    # Send data to site users.
    for user_id, channel_names in websocket_user_cache.get_all().items():
        if not user_id:
            # Anonymous user
            user = None
        else:
            try:
                user = user_to_collection_user(user_id)
            except ObjectDoesNotExist:
                # The user does not exist. Skip him/her.
                continue
        output = collection_elements.as_autoupdate_for_user(user)
        for channel_name in channel_names:
            send_or_wait(Channel(channel_name).send, {'text': json.dumps(output)})

    # Check whether broadcast is active at the moment and set the local
    # projector queryset.
    if config['projector_broadcast'] > 0:
        queryset = Projector.objects.filter(pk=config['projector_broadcast'])
    else:
        queryset = Projector.objects.all()

    # Loop over all projectors and send data that they need.
    for projector in queryset:
        output = []
        for collection_element in collection_elements:
            if collection_element.is_deleted():
                output.append(collection_element.as_autoupdate_for_projector())
            else:
                for element in projector.get_collection_elements_required_for_this(collection_element):
                    output.append(element.as_autoupdate_for_projector())
        if output:
            if config['projector_broadcast'] > 0:
                send_or_wait(
                    Group('projector-all').send,
                    {'text': json.dumps(output)})
            else:
                send_or_wait(
                    Group('projector-{}'.format(projector.pk)).send,
                    {'text': json.dumps(output)})


def inform_changed_data(instances, information=None):
    """
    Informs the autoupdate system and the caching system about the creation or
    update of an element.

    The argument instances can be one instance or an interable over instances.
    """
    root_instances = set()
    if not isinstance(instances, Iterable):
        # Make sure instances is an iterable
        instances = (instances, )
    for instance in instances:
        try:
            root_instances.add(instance.get_root_rest_element())
        except AttributeError:
            # Instance has no method get_root_rest_element. Just ignore it.
            pass

    # Generates an collection element list for the root_instances.
    collection_elements = CollectionElementList()
    for root_instance in root_instances:
        collection_elements.append(
            CollectionElement.from_instance(
                root_instance,
                information=information))
    # If currently there is an open database transaction, then the
    # send_autoupdate function is only called, when the transaction is
    # commited. If there is currently no transaction, then the function
    # is called immediately.
    transaction.on_commit(lambda: send_autoupdate(collection_elements))


def inform_deleted_data(*args, information=None):
    """
    Informs the autoupdate system and the caching system about the deletion of
    elements.

    The function has to be called with the attributes collection_string and id.
    Multible elements can be used. For example:

    inform_deleted_data('motions/motion', 1, 'assignments/assignment', 5)

    The argument information is added to each collection element.
    """
    if len(args) % 2 or not args:
        raise ValueError(
            "inform_deleted_data has to be called with the same number of "
            "collection strings and ids. It has to be at least one collection "
            "string and one id.")

    # Go through each pair of collection_string and id and generate a collection
    # element from it.
    collection_elements = CollectionElementList()
    for index in range(0, len(args), 2):
        collection_elements.append(CollectionElement.from_values(
            collection_string=args[index],
            id=args[index + 1],
            deleted=True,
            information=information))
    # If currently there is an open database transaction, then the
    # send_autoupdate function is only called, when the transaction is
    # commited. If there is currently no transaction, then the function
    # is called immediately.
    transaction.on_commit(lambda: send_autoupdate(collection_elements))


def inform_data_collection_element_list(collection_elements, information=None):
    """
    Informs the autoupdate system about some collection elements. This is
    used just to send some data to all users.
    """
    # If currently there is an open database transaction, then the
    # send_autoupdate function is only called, when the transaction is
    # commited. If there is currently no transaction, then the function
    # is called immediately.
    transaction.on_commit(lambda: send_autoupdate(collection_elements))


def send_autoupdate(collection_elements):
    """
    Helper function, that sends collection_elements through a channel to the
    autoupdate system.

    Does nothing if collection_elements is empty.
    """
    if collection_elements:
        send_or_wait(
            Channel('autoupdate.send_data').send,
            collection_elements.as_channels_message())
