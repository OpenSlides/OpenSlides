import itertools
import json

from asgiref.inmemory import ChannelLayer
from channels import Channel, Group
from channels.auth import channel_session_user, channel_session_user_from_http
from django.db import transaction
from django.utils import timezone

from ..core.config import config
from ..core.models import Projector
from ..users.auth import AnonymousUser
from ..users.models import User
from .collection import Collection, CollectionElement


def get_logged_in_users():
    """
    Helper to get all logged in users.

    Only works with the OpenSlides session backend.
    """
    return User.objects.exclude(session=None).filter(session__expire_date__gte=timezone.now()).distinct()


def get_projector_element_data(projector, on_slide=None):  # TODO autoupdate
    """
    Returns a list of dicts that are required for a specific projector.

    The argument projector has to be a projector instance.

    If on_slide is a string that matches an slide on the projector, then only
    elements on this slide are returned.
    """
    output = []
    for requirement in projector.get_all_requirements(on_slide):
        required_collection_element = CollectionElement.from_instance(requirement)
        output.append(required_collection_element.as_autoupdate_for_projector())
    return output


@channel_session_user_from_http
def ws_add_site(message):
    """
    Adds the websocket connection to a group specific to the connecting user.

    The group with the name 'user-None' stands for all anonymous users.
    """
    Group('user-{}'.format(message.user.id)).add(message.reply_channel)


@channel_session_user
def ws_disconnect_site(message):
    """
    This function is called, when a client on the site disconnects.
    """
    Group('user-{}'.format(message.user.id)).discard(message.reply_channel)


@channel_session_user_from_http
def ws_add_projector(message, projector_id):
    """
    Adds the websocket connection to a group specific to the projector with the given id.
    Also sends all data that are shown on the projector.
    """
    user = message.user
    # user is the django anonymous user. We have our own.
    if user.is_anonymous and config['general_systen_enable_anonymous']:
        user = AnonymousUser()

    if not user.has_perm('core.can_see_projector'):
        message.reply_channel.send({'text': 'No permissions to see this projector.'})
    else:
        try:
            projector = Projector.objects.get(pk=projector_id)
        except Projector.DoesNotExist:
            message.reply_channel.send({'text': 'The projector {} does not exist.'.format(projector_id)})
        else:
            # At first, the client is added to the projector group, so it is
            # informed if the data change.
            Group('projector-{}'.format(projector_id)).add(message.reply_channel)

            # Send all elements that are on the projector.
            output = get_projector_element_data(projector)  # TODO autoupdate

            # Send all config elements.
            collection = Collection(config.get_collection_string())
            output.extend(collection.as_autoupdate_for_projector())

            # Send the projector instance.
            collection_element = CollectionElement.from_instance(projector)
            output.append(collection_element.as_autoupdate_for_projector())

            # Send all the data that was only collected before
            message.reply_channel.send({'text': json.dumps(output)})


def ws_disconnect_projector(message, projector_id):
    """
    This function is called, when a client on the projector disconnects.
    """
    Group('projector-{}'.format(projector_id)).discard(message.reply_channel)


def send_data(message):  # TODO autoupdate
    """
    Informs all users about changed data.
    """
    collection_element = CollectionElement.from_values(**message)

    # Loop over all logged in users and the anonymous user.
    for user in itertools.chain(get_logged_in_users(), [AnonymousUser()]):
        channel = Group('user-{}'.format(user.id))
        output = collection_element.as_autoupdate_for_user(user)
        channel.send({'text': json.dumps([output])})

    # Get the projector elements where data have to be sent and if whole projector
    # has to be updated.
    if collection_element.collection_string == config.get_collection_string():
        # Config elements are always send to each projector
        projectors = Projector.objects.all()
        send_all = None  # The decission is done later
    elif collection_element.collection_string == Projector.get_collection_string():
        # Update a projector, when the projector element is updated.
        projectors = [collection_element.get_instance()]
        send_all = True
    elif collection_element.is_deleted():
        projectors = Projector.objects.all()
        send_all = False
    else:
        # Other elements are only send to the projector they are currently shown
        projectors = Projector.get_projectors_that_show_this(collection_element)
        send_all = None  # The decission is done later

    broadcast_id = config['projector_broadcast']
    if broadcast_id > 0:
        projectors = Projector.objects.all()  # Also the broadcasted projector should get his data
        send_all = True
        broadcast_projector_data = get_projector_element_data(Projector.objects.get(pk=broadcast_id))
        broadcast_projector_data.append(CollectionElement.from_values(
            collection_string=Projector.get_collection_string(), id=broadcast_id).as_autoupdate_for_projector())
    else:
        broadcast_projector_data = None

    for projector in projectors:
        if send_all is None:
            send_all = projector.need_full_update_for_this(collection_element)
        if send_all:
            if broadcast_projector_data is None:
                output = get_projector_element_data(projector)
            else:
                output = broadcast_projector_data
        else:
            # The list will be filled in the next lines.
            output = []

        output.append(collection_element.as_autoupdate_for_projector())
        if output:
            Group('projector-{}'.format(projector.pk)).send(
                {'text': json.dumps(output)})


def inform_changed_data(instance, information=None):
    """
    Informs the autoupdate system and the caching system about the creation or
    update of an element.
    """
    try:
        root_instance = instance.get_root_rest_element()
    except AttributeError:
        # Instance has no method get_root_rest_element. Just ignore it.
        pass
    else:
        collection_element = CollectionElement.from_instance(
            root_instance,
            information=information)
        # If currently there is an open database transaction, then the
        # send_autoupdate function is only called, when the transaction is
        # commited. If there is currently no transaction, then the function
        # is called immediately.
        transaction.on_commit(lambda: send_autoupdate(collection_element))


def inform_deleted_data(collection_string, id, information=None):
    """
    Informs the autoupdate system and the caching system about the deletion of
    an element.
    """
    collection_element = CollectionElement.from_values(
        collection_string=collection_string,
        id=id,
        deleted=True,
        information=information)
    # If currently there is an open database transaction, then the
    # send_autoupdate function is only called, when the transaction is
    # commited. If there is currently no transaction, then the function
    # is called immediately.
    transaction.on_commit(lambda: send_autoupdate(collection_element))


def send_autoupdate(collection_element):
    """
    Helper function, that sends a collection_element through a channel to the
    autoupdate system.
    """
    try:
        Channel('autoupdate.send_data').send(collection_element.as_channels_message())
    except ChannelLayer.ChannelFull:
        pass
