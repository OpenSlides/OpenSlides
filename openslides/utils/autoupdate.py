import itertools
import json

from asgiref.inmemory import ChannelLayer
from channels import Channel, Group
from channels.auth import channel_session_user, channel_session_user_from_http
from django.apps import apps
from django.utils import timezone

from ..users.auth import AnonymousUser
from ..users.models import User
from .access_permissions import BaseAccessPermissions


def get_logged_in_users():
    """
    Helper to get all logged in users.

    Only works with the OpenSlides session backend.
    """
    return User.objects.exclude(session=None).filter(session__expire_date__gte=timezone.now()).distinct()


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
    Adds the websocket connection to a group specific to the connecting user.

    The group with the name 'user-None' stands for all anonymous users.
    """
    Group('user-{}'.format(message.user.id)).add(message.reply_channel)


# Connected to websocket.disconnect
@channel_session_user
def ws_disconnect(message):
    Group('user-{}'.format(message.user.id)).discard(message.reply_channel)


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
    for user in itertools.chain(get_logged_in_users(), [AnonymousUser()]):
        channel = Group('user-{}'.format(user.id))
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
        try:
            Channel('autoupdate.send_data').send({
                'collection_string': root_instance.get_collection_string(),
                'pk': root_instance.pk,
                'is_deleted': is_deleted and instance == root_instance,
                'dispatch_uid': root_instance.get_access_permissions().get_dispatch_uid()})
        except ChannelLayer.ChannelFull:
            pass


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
