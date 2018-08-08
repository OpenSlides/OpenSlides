import json
import threading
import time
import warnings
from collections import OrderedDict, defaultdict
from typing import Any, Dict, Generator, Iterable, List, Optional, Tuple, Union

from channels import Channel, Group
from channels.asgi import get_channel_layer
from channels.auth import channel_session_user, channel_session_user_from_http
from django.apps import apps
from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction
from django.db.models import Model

from ..core.config import config
from ..core.models import Projector
from .auth import anonymous_is_enabled, has_perm, user_to_collection_user
from .cache import restricted_data_cache, websocket_user_cache
from .collection import AutoupdateFormat  # noqa
from .collection import (
    ChannelMessageFormat,
    Collection,
    CollectionElement,
    format_for_autoupdate,
    from_channel_message,
    to_channel_message,
)


def send_or_wait(send_func: Any, *args: Any, **kwargs: Any) -> None:
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
def ws_add_site(message: Any) -> None:
    """
    Adds the websocket connection to a group specific to the connecting user.

    The group with the name 'user-None' stands for all anonymous users.

    Send all "startup-data" through the connection.
    """
    if not anonymous_is_enabled() and not message.user.id:
        send_or_wait(message.reply_channel.send, {'accept': False})
        return

    Group('site').add(message.reply_channel)
    message.channel_session['user_id'] = message.user.id
    # Saves the reply channel to the user. Uses 0 for anonymous users.
    websocket_user_cache.add(message.user.id or 0, message.reply_channel.name)

    # Open the websocket connection.
    send_or_wait(message.reply_channel.send, {'accept': True})

    # Collect all elements that shoud be send to the client when the websocket
    # connection is established.
    user = user_to_collection_user(message.user.id)
    user_id = user.id if user is not None else 0
    if restricted_data_cache.exists_for_user(user_id):
        output = restricted_data_cache.get_data(user_id)
    else:
        output = []
        for collection in get_startup_collections():
            access_permissions = collection.get_access_permissions()
            restricted_data = access_permissions.get_restricted_data(collection.get_full_data(), user)

            for data in restricted_data:
                if data is None:
                    # We do not want to send 'deleted' objects on startup.
                    # That's why we skip such data.
                    continue

                formatted_data = format_for_autoupdate(
                    collection_string=collection.collection_string,
                    id=data['id'],
                    action='changed',
                    data=data)

                output.append(formatted_data)
                # Cache restricted data for user
                restricted_data_cache.add_element(
                    user_id,
                    collection.collection_string,
                    data['id'],
                    formatted_data)

    # Send all data.
    if output:
        send_or_wait(message.reply_channel.send, {'text': json.dumps(output)})


@channel_session_user
def ws_disconnect_site(message: Any) -> None:
    """
    This function is called, when a client on the site disconnects.
    """
    Group('site').discard(message.reply_channel)
    websocket_user_cache.remove(message.user.id or 0, message.reply_channel.name)


@channel_session_user
def ws_receive_site(message: Any) -> None:
    """
    If we recieve something from the client we currently just interpret this
    as a notify message.

    The server adds the sender's user id (0 for anonymous) and reply
    channel name so that a receiver client may reply to the sender or to all
    sender's instances.
    """
    try:
        incomming = json.loads(message.content['text'])
    except ValueError:
        # Message content is invalid. Just do nothing.
        pass
    else:
        if isinstance(incomming, list):
            notify(
                incomming,
                senderReplyChannelName=message.reply_channel.name,
                senderUserId=message.user.id or 0)


def notify(incomming: List[Dict[str, Any]], **attributes: Any) -> None:
    """
    The incomming should be a list of notify elements. Every item is broadcasted
    to the given users, channels or projectors. If none is given, the message is
    send to each site client.
    """
    # Parse all items
    receivers_users = defaultdict(list)  # type: Dict[int, List[Any]]
    receivers_projectors = defaultdict(list)  # type: Dict[int, List[Any]]
    receivers_reply_channels = defaultdict(list)  # type: Dict[str, List[Any]]
    items_for_all = []
    for item in incomming:
        if item.get('collection') == 'notify':
            use_receivers_dict = False

            for key, value in attributes.items():
                item[key] = value

            # Force the params to be a dict
            if not isinstance(item.get('params'), dict):
                item['params'] = {}

            users = item.get('users')
            if isinstance(users, list):
                # Send this item only to all reply channels of some site users.
                for user_id in users:
                    receivers_users[user_id].append(item)
                use_receivers_dict = True

            projectors = item.get('projectors')
            if isinstance(projectors, list):
                # Send this item only to all reply channels of some site users.
                for projector_id in projectors:
                    receivers_projectors[projector_id].append(item)
                use_receivers_dict = True

            reply_channels = item.get('replyChannels')
            if isinstance(reply_channels, list):
                # Send this item only to some reply channels.
                for reply_channel_name in reply_channels:
                    receivers_reply_channels[reply_channel_name].append(item)
                use_receivers_dict = True

            if not use_receivers_dict:
                # Send this item to all reply channels.
                items_for_all.append(item)

    # Send all items
    for user_id, channel_names in websocket_user_cache.get_all().items():
        output = receivers_users[user_id]
        if len(output) > 0:
            for channel_name in channel_names:
                send_or_wait(Channel(channel_name).send, {'text': json.dumps(output)})

    for channel_name, output in receivers_reply_channels.items():
        if len(output) > 0:
            send_or_wait(Channel(channel_name).send, {'text': json.dumps(output)})

    for projector_id, output in receivers_projectors.items():
        if len(output) > 0:
            send_or_wait(Group('projector-{}'.format(projector_id)).send, {'text': json.dumps(output)})

    if len(items_for_all) > 0:
        send_or_wait(Group('site').send, {'text': json.dumps(items_for_all)})


@channel_session_user_from_http
def ws_add_projector(message: Any, projector_id: int) -> None:
    """
    Adds the websocket connection to a group specific to the projector with the given id.
    Also sends all data that are shown on the projector.
    """
    user = user_to_collection_user(message.user.id)

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
            output = []  # type: List[AutoupdateFormat]
            for requirement in projector.get_all_requirements():
                required_collection_element = CollectionElement.from_instance(requirement)
                output.append(required_collection_element.as_autoupdate_for_projector())

            # Collect all config elements.
            config_collection = Collection(config.get_collection_string())
            projector_data = (config_collection.get_access_permissions()
                              .get_projector_data(config_collection.get_full_data()))
            for data in projector_data:
                output.append(format_for_autoupdate(
                    config_collection.collection_string,
                    data['id'],
                    'changed',
                    data))

            # Collect the projector instance.
            collection_element = CollectionElement.from_instance(projector)
            output.append(collection_element.as_autoupdate_for_projector())

            # Send all the data that were only collected before.
            send_or_wait(message.reply_channel.send, {'text': json.dumps(output)})


def ws_disconnect_projector(message: Any, projector_id: int) -> None:
    """
    This function is called, when a client on the projector disconnects.
    """
    Group('projector-{}'.format(projector_id)).discard(message.reply_channel)
    Group('projector-all').discard(message.reply_channel)


def ws_receive_projector(message: Any, projector_id: int) -> None:
    """
    If we recieve something from the client we currently just interpret this
    as a notify message.

    The server adds the sender's projector id and reply channel name so that
    a receiver client may reply to the sender or to all sender's instances.
    """
    try:
        incomming = json.loads(message.content['text'])
    except ValueError:
        # Message content is invalid. Just do nothing.
        pass
    else:
        if isinstance(incomming, list):
            notify(
                incomming,
                senderReplyChannelName=message.reply_channel.name,
                senderProjectorId=projector_id)


def send_data_projector(message: ChannelMessageFormat) -> None:
    """
    Informs all projector clients about changed data.
    """
    collection_elements = from_channel_message(message)

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


def send_data_site(message: ChannelMessageFormat) -> None:
    """
    Informs all site users about changed data.
    """
    collection_elements = from_channel_message(message)

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

        output = []
        for collection_element in collection_elements:
            formatted_data = collection_element.as_autoupdate_for_user(user)
            if formatted_data['action'] == 'changed':
                restricted_data_cache.update_element(
                    user_id or 0,
                    collection_element.collection_string,
                    collection_element.id,
                    formatted_data)
            else:
                restricted_data_cache.del_element(
                    user_id or 0,
                    collection_element.collection_string,
                    collection_element.id)
            output.append(formatted_data)

        for channel_name in channel_names:
            send_or_wait(Channel(channel_name).send, {'text': json.dumps(output)})


def to_ordered_dict(d: Optional[Dict]) -> Optional[OrderedDict]:
    """
    Little helper to hash information dict in inform_*_data.
    """
    if isinstance(d, dict):
        result = OrderedDict([(key, to_ordered_dict(d[key])) for key in sorted(d.keys())])  # type: Optional[OrderedDict]
    else:
        result = d
    return result


def inform_changed_data(instances: Union[Iterable[Model], Model], information: Dict[str, Any] = None) -> None:
    """
    Informs the autoupdate system and the caching system about the creation or
    update of an element. This is done via the AutoupdateBundleMiddleware.

    The argument instances can be one instance or an iterable over instances.
    """
    root_instances = set()
    if not isinstance(instances, Iterable):
        instances = (instances, )

    for instance in instances:
        try:
            root_instances.add(instance.get_root_rest_element())
        except AttributeError:
            # Instance has no method get_root_rest_element. Just ignore it.
            pass

    # Put all collection elements into the autoupdate_bundle.
    bundle = autoupdate_bundle.get(threading.get_ident())
    if bundle is not None:
        # Run autoupdate only if the bundle exists because we are in a request-response-cycle.
        for root_instance in root_instances:
            collection_element = CollectionElement.from_instance(
                root_instance,
                information=information)
            key = root_instance.get_collection_string() + str(root_instance.get_rest_pk()) + str(to_ordered_dict(information))
            bundle[key] = collection_element


def inform_deleted_data(elements: Iterable[Tuple[str, int]], information: Dict[str, Any] = None) -> None:
    """
    Informs the autoupdate system and the caching system about the deletion of
    elements. This is done via the AutoupdateBundleMiddleware.

    The argument information is added to each collection element.
    """
    # Put all stuff to be deleted into the autoupdate_bundle.
    bundle = autoupdate_bundle.get(threading.get_ident())
    if bundle is not None:
        # Run autoupdate only if the bundle exists because we are in a request-response-cycle.
        for element in elements:
            collection_element = CollectionElement.from_values(
                collection_string=element[0],
                id=element[1],
                deleted=True,
                information=information)
            key = element[0] + str(element[1]) + str(to_ordered_dict(information))
            bundle[key] = collection_element


def inform_data_collection_element_list(collection_elements: List[CollectionElement],
                                        information: Dict[str, Any] = None) -> None:
    """
    Informs the autoupdate system about some collection elements. This is
    used just to send some data to all users.
    """
    # Put all stuff into the autoupdate_bundle.
    bundle = autoupdate_bundle.get(threading.get_ident())
    if bundle is not None:
        # Run autoupdate only if the bundle exists because we are in a request-response-cycle.
        for collection_element in collection_elements:
            key = collection_element.collection_string + str(collection_element.id) + str(to_ordered_dict(information))
            bundle[key] = collection_element


"""
Global container for autoupdate bundles
"""
autoupdate_bundle = {}  # type: Dict[int, Dict[str, CollectionElement]]


class AutoupdateBundleMiddleware:
    """
    Middleware to handle autoupdate bundling.
    """
    def __init__(self, get_response: Any) -> None:
        self.get_response = get_response
        # One-time configuration and initialization.

    def __call__(self, request: Any) -> Any:
        thread_id = threading.get_ident()
        autoupdate_bundle[thread_id] = {}

        response = self.get_response(request)

        bundle = autoupdate_bundle.pop(thread_id)  # type: Dict[str, CollectionElement]
        # If currently there is an open database transaction, then the
        # send_autoupdate function is only called, when the transaction is
        # commited. If there is currently no transaction, then the function
        # is called immediately.
        transaction.on_commit(lambda: send_autoupdate(bundle.values()))
        return response


def send_autoupdate(collection_elements: Iterable[CollectionElement]) -> None:
    """
    Helper function, that sends collection_elements through a channel to the
    autoupdate system.

    Does nothing if collection_elements is empty.
    """
    if collection_elements:
        send_or_wait(
            Channel('autoupdate.send_data_projector').send,
            to_channel_message(collection_elements))
        send_or_wait(
            Channel('autoupdate.send_data_site').send,
            to_channel_message(collection_elements))


def get_startup_collections() -> Generator[Collection, None, None]:
    """
    Returns all Collections that should be send to the user at startup
    """
    for app in apps.get_app_configs():
        try:
            # Get the method get_startup_elements() from an app.
            # This method has to return an iterable of Collection objects.
            get_startup_elements = app.get_startup_elements
        except AttributeError:
            # Skip apps that do not implement get_startup_elements.
            continue

        yield from get_startup_elements()
