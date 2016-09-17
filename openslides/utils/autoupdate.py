import itertools
import json

from asgiref.inmemory import ChannelLayer
from channels import Channel, Group
from channels.auth import channel_session_user, channel_session_user_from_http
from django.apps import apps
from django.db import transaction
from django.utils import timezone

from ..users.auth import AnonymousUser
from ..users.models import User
from .access_permissions import BaseAccessPermissions
from ..core.models import Projector
from ..core.config import config


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


@channel_session_user_from_http
def ws_add_site(message):
    """
    Adds the websocket connection to a group specific to the connecting user.

    The group with the name 'user-None' stands for all anonymous users.
    """
    Group('user-{}'.format(message.user.id)).add(message.reply_channel)


@channel_session_user
def ws_disconnect_site(message):
    Group('user-{}'.format(message.user.id)).discard(message.reply_channel)


def ws_add_projector(message, projector_id):
    """
    Add a websocket connection for a specific projector.
    """
    #TODO: rechte Check für Projektor

    # TODO: Get all elements on the projector and send them
    #message.reply_channel.send({'text': 'bar'})
    try:
        projector = Projector.objects.get(pk=projector_id)
    except Projector.DoesNotExist:
        pass
    else:
        # At first, the client is added to the projector group, so it gets
        # informed when the data change
        Group('projector-{}'.format(projector_id)).add(message.reply_channel)
        output = []

        # Send all elements that are on the projector
        for instance in projector.get_all_requirements():
            access_permissions = instance.get_access_permissions()
            full_data = access_permissions.get_full_data(instance)
            data = access_permissions.get_projector_data(full_data)
            if data is not None:
                output.append({
                    'collection': instance.get_collection_string(),
                    'id': instance.pk,
                    'action': 'changed',
                    'data': data})

        # Send all config elements.
        for key, value in config.items():
            output.append({
                'collection': config.get_collection_string(),
                'id': key,
                'action': 'changed',
                'data': {'key': key, 'value': value}})

        # Send the projector instance.
        access_permissions = projector.get_access_permissions()
        full_data = access_permissions.get_full_data(projector)
        data = access_permissions.get_projector_data(full_data)
        output.append({
            'collection': projector.get_collection_string(),
            'id': projector.pk,
            'action': 'changed',
            'data': data})

        # Send all the data that was only collected before
        message.reply_channel.send({'text': json.dumps(output)})


def ws_disconnect_projector(message):
    # TODO: woher bekomme ich die projector_id? from channels.sessions import channel_session
    Group('projector-{}'.format(message.projector_id)).discard(message.reply_channel)


def send_data(message):
    """
    Informs all users about changed data.

    The argument message has to be a dict with the keywords collection_string
    (string), pk (positive integer) and id_deleted (boolean).
    """
    if not message['is_deleted']:
        Model = get_model_from_collection_string(message['collection_string'])
        instance = Model.objects.get(pk=message['pk'])
        access_permissions = instance.get_access_permissions()
        full_data = access_permissions.get_full_data(instance)

    base_output = {
        'collection': message['collection_string'],
        'id': message['pk'],  # == instance.get_rest_pk()
        'action': 'deleted' if message['is_deleted'] else 'changed'}

    # Loop over all logged in users and the anonymous user.
    for user in itertools.chain(get_logged_in_users(), [AnonymousUser()]):
        channel = Group('user-{}'.format(user.id))
        output = base_output.copy()
        if not message['is_deleted']:
            data = access_permissions.get_restricted_data(full_data, user)
            if data is None:
                # There are no data for the user so he can't see the object. Skip him.
                continue
            output['data'] = data
        channel.send({'text': json.dumps([output])})

    # Send the element to the projector:
    if message['collection_string'] in (
            Projector.get_collection_string(),
            config.get_collection_string()):
        # Config- and projector-elements are always send to each projector
        projector_ids = Projector.objects.values_list('pk', flat=True)
    else:
        # Other elements are only send to the projector they are currently shown
        projector_ids = Projector.get_projectors_that_show_this(message)

    if projector_ids:
        output = base_output.copy()
        data = access_permissions.get_projector_data(full_data)
        if data is not None:
            for projector_id in projector_ids:
                output['data'] = data
                Group('projector-{}'.format(projector_id)).send(
                    {'text': json.dumps([output])})


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
