import json

from asgiref.inmemory import ChannelLayer
from channels import Channel, Group
from channels.auth import channel_session_user_from_http
from channels.sessions import session_for_reply_channel
from django.apps import apps
from django.contrib.auth import get_user
from django.db import transaction

from ..users.auth import AnonymousUser
from .access_permissions import BaseAccessPermissions


def get_model_from_collection_string(collection_string):
    """
    Returns a model class which belongs to the argument collection_string.
    """
    def model_generator():
        """
        Yields all models of all apps.
        """
        for app_config in apps.get_app_configs():
            for model in app_config.get_models():
                yield model

    for model in model_generator():
        try:
            model_collection_string = model.get_collection_string()
        except AttributeError:
            # Skip models which do not have the method get_collection_string.
            pass
        else:
            if model_collection_string == collection_string:
                # The model was found.
                break
    else:
        # No model was found in all apps.
        raise ValueError('Invalid message. A valid collection_string is missing.')
    return model


# Connected to websocket.connect
@channel_session_user_from_http
def ws_add(message):
    """
    Adds the websocket connection to the group autoupdate.
    """
    Group('autoupdate').add(message.reply_channel)


# Connected to websocket.disconnect
def ws_disconnect(message):
    Group('autoupdate').discard(message.reply_channel)


def send_data(message):
    """
    Informs all users about changed data.

    The argument message has to be a dict with the keywords collection_string
    (string), pk (positive integer), id_deleted (boolean) and dispatch_uid
    (string).
    """
    for access_permissions in BaseAccessPermissions.get_all():
        if access_permissions.get_dispatch_uid() == message['dispatch_uid']:
            break
    else:
        raise ValueError('Invalid message. A valid dispatch_uid is missing.')

    if not message['is_deleted']:
        Model = get_model_from_collection_string(message['collection_string'])
        instance = Model.objects.get(pk=message['pk'])
        full_data = access_permissions.get_full_data(instance)

    # Loop over all logged in users and the anonymous user.
    for channel_name in Group('autoupdate').channel_layer.group_channels('autoupdate'):
        channel = Channel(channel_name)
        session = session_for_reply_channel(channel_name)
        if session is None:
            user = AnonymousUser()
        else:
            # Get the user from a session. There is currently no better way.
            # See: channels.auth.channel_session_user
            fake_request = type("FakeRequest", (object, ), {"session": session})
            user = get_user(fake_request)

        output = {
            'collection': message['collection_string'],
            'id': message['pk'],  # == instance.get_rest_pk()
            'action': 'deleted' if message['is_deleted'] else 'changed'}
        if not message['is_deleted']:
            data = access_permissions.get_restricted_data(full_data, user)
            if data is None:
                # There are no data for the user so he can't see the object. Skip him.
                continue
            output['data'] = data
        channel.send({'text': json.dumps(output)})


def inform_changed_data(instance, is_deleted=False):
    try:
        root_instance = instance.get_root_rest_element()
    except AttributeError:
        # Instance has no method get_root_rest_element. Just ignore it.
        pass
    else:
        message_dict = {
            'collection_string': root_instance.get_collection_string(),
            'pk': root_instance.pk,
            'is_deleted': is_deleted and instance == root_instance,
            'dispatch_uid': root_instance.get_access_permissions().get_dispatch_uid(),
        }

        # If currently there is an open database transaction, then the following
        # function is only called, when the transaction is commited. If there
        # is currently no transaction, then the function is called immediately.
        def send_autoupdate(message):
            try:
                Channel('autoupdate.send_data').send(message)
            except ChannelLayer.ChannelFull:
                pass

        transaction.on_commit(lambda: send_autoupdate(message_dict))


def inform_changed_data_receiver(sender, instance, **kwargs):
    """
    Receiver for the inform_changed_data function to use in a signal.
    """
    inform_changed_data(instance)


def inform_deleted_data_receiver(sender, instance, **kwargs):
    """
    Receiver for the inform_changed_data function to use in a signal.
    """
    inform_changed_data(instance, is_deleted=True)
