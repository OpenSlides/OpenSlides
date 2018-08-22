from typing import Any, Dict, List, Optional

from asgiref.sync import sync_to_async
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer

from ..core.config import config
from ..core.models import Projector
from .auth import async_anonymous_is_enabled, has_perm
from .cache import element_cache, split_element_id
from .collection import (
    Collection,
    CollectionElement,
    format_for_autoupdate,
    from_channel_message,
)


class SiteConsumer(AsyncJsonWebsocketConsumer):
    """
    Websocket Consumer for the site.
    """
    groups = ['site']

    async def connect(self) -> None:
        """
        A user connects to the site.

        If it is an anonymous user and anonymous is disabled, the connection is closed.

        Sends the startup data to the user.
        """
        # TODO: add a way to ask for the data since a change_id and send only data that is newer
        if not await async_anonymous_is_enabled() and self.scope['user'].id is None:
            await self.close()
        else:
            await self.accept()
            data = await startup_data(self.scope['user'])
            await self.send_json(data)

    async def receive_json(self, content: Any) -> None:
        """
        If we recieve something from the client we currently just interpret this
        as a notify message.

        The server adds the sender's user id (0 for anonymous) and reply
        channel name so that a receiver client may reply to the sender or to all
        sender's instances.
        """
        if notify_message_is_valid(content):
            await self.channel_layer.group_send(
                "projector",
                {
                    "type": "send_notify",
                    "incomming": content,
                    "senderReplyChannelName": self.channel_name,
                    "senderUserId": self.scope['user'].id or 0,
                },
            )
            await self.channel_layer.group_send(
                "site",
                {
                    "type": "send_notify",
                    "incomming": content,
                    "senderReplyChannelName": self.channel_name,
                    "senderUserId": self.scope['user'].id or 0,
                },
            )
        else:
            await self.send_json({'error': 'invalid message'})

    async def send_notify(self, event: Dict[str, Any]) -> None:
        """
        Send a notify message to the user.
        """
        user_id = self.scope['user'].id or 0

        out = []
        for item in event['incomming']:
            users = item.get('users')
            reply_channels = item.get('replyChannels')
            projectors = item.get('projectors')
            if ((isinstance(users, list) and user_id in users)
                    or (isinstance(reply_channels, list) and self.channel_name in reply_channels)
                    or (users is None and reply_channels is None and projectors is None)):
                item['senderReplyChannelName'] = event.get('senderReplyChannelName')
                item['senderUserId'] = event.get('senderUserId')
                item['senderProjectorId'] = event.get('senderProjectorId')
                out.append(item)

        if out:
            await self.send_json(out)

    async def send_data(self, event: Dict[str, Any]) -> None:
        """
        Send changed or deleted elements to the user.
        """
        change_id = event['change_id']
        output = []
        changed_elements, deleted_elements = await element_cache.get_restricted_data(self.scope['user'], change_id)
        for collection_string, elements in changed_elements.items():
            for element in elements:
                output.append(format_for_autoupdate(
                    collection_string=collection_string,
                    id=element['id'],
                    action='changed',
                    data=element))
        for element_id in deleted_elements:
            collection_string, id = split_element_id(element_id)
            output.append(format_for_autoupdate(
                collection_string=collection_string,
                id=id,
                action='deleted'))
        await self.send_json(output)


class ProjectorConsumer(AsyncJsonWebsocketConsumer):
    """
    Websocket Consumer for the projector.
    """

    groups = ['projector']

    async def connect(self) -> None:
        """
        Adds the websocket connection to a group specific to the projector with the given id.
        Also sends all data that are shown on the projector.
        """
        user = self.scope['user']
        projector_id = self.scope["url_route"]["kwargs"]["projector_id"]
        await self.accept()

        if not await database_sync_to_async(has_perm)(user, 'core.can_see_projector'):
            await self.send_json({'text': 'No permissions to see this projector.'})
            # TODO: Shouldend we just close the websocket connection with an error message?
            #       self.close(code=4403)
        else:
            out = await sync_to_async(projector_startup_data)(projector_id)
            await self.send_json(out)

    async def receive_json(self, content: Any) -> None:
        """
        If we recieve something from the client we currently just interpret this
        as a notify message.

        The server adds the sender's user id (0 for anonymous) and reply
        channel name so that a receiver client may reply to the sender or to all
        sender's instances.
        """
        projector_id = self.scope["url_route"]["kwargs"]["projector_id"]
        await self.channel_layer.group_send(
            "projector",
            {
                "type": "send_notify",
                "incomming": content,
                "senderReplyChannelName": self.channel_name,
                "senderProjectorId": projector_id,
            },
        )
        await self.channel_layer.group_send(
            "site",
            {
                "type": "send_notify",
                "incomming": content,
                "senderReplyChannelName": self.channel_name,
                "senderProjectorId": projector_id,
            },
        )

    async def send_notify(self, event: Dict[str, Any]) -> None:
        """
        Send a notify message to the projector.
        """
        projector_id = self.scope["url_route"]["kwargs"]["projector_id"]

        out = []
        for item in event['incomming']:
            users = item.get('users')
            reply_channels = item.get('replyChannels')
            projectors = item.get('projectors')
            if ((isinstance(projectors, list) and projector_id in projectors)
                    or (isinstance(reply_channels, list) and self.channel_name in reply_channels)
                    or (users is None and reply_channels is None and projectors is None)):
                item['senderReplyChannelName'] = event.get('senderReplyChannelName')
                item['senderUserId'] = event.get('senderUserId')
                item['senderProjectorId'] = event.get('senderProjectorId')
                out.append(item)

        if out:
            await self.send_json(out)

    async def send_data(self, event: Dict[str, Any]) -> None:
        """
        Informs all projector clients about changed data.
        """
        projector_id = self.scope["url_route"]["kwargs"]["projector_id"]
        collection_elements = from_channel_message(event['message'])

        output = await projector_sync_send_data(projector_id, collection_elements)
        if output:
            await self.send_json(output)


async def startup_data(user: Optional[CollectionElement], change_id: int = 0) -> List[Any]:
    """
    Returns all data for startup.
    """
    # TODO: use the change_id argument
    output = []
    restricted_data = await element_cache.get_all_restricted_data(user)
    for collection_string, elements in restricted_data.items():
        for element in elements:
            formatted_data = format_for_autoupdate(
                collection_string=collection_string,
                id=element['id'],
                action='changed',
                data=element)

            output.append(formatted_data)
    return output


def projector_startup_data(projector_id: int) -> Any:
    """
    Generate the startup data for a projector.
    """
    try:
        projector = Projector.objects.get(pk=projector_id)
    except Projector.DoesNotExist:
        return {'text': 'The projector {} does not exist.'.format(projector_id)}
    else:
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
        return output


@sync_to_async
def projector_sync_send_data(projector_id: int, collection_elements: List[CollectionElement]) -> List[Any]:
    """
    sync function that generates the elements for an projector.
    """
    # Load the projector object. If broadcast is on, use the broadcast projector
    # instead.
    if config['projector_broadcast'] > 0:
        projector_id = config['projector_broadcast']

    projector = Projector.objects.get(pk=projector_id)

    # TODO: This runs once for every open projector tab. Either use
    #       caching or something else, so this is only called once
    output = []
    for collection_element in collection_elements:
        if collection_element.is_deleted():
            output.append(collection_element.as_autoupdate_for_projector())
        else:
            for element in projector.get_collection_elements_required_for_this(collection_element):
                output.append(element.as_autoupdate_for_projector())
    return output


def notify_message_is_valid(message: object) -> bool:
    """
    Returns True, when the message is a valid notify_message.
    """
    if not isinstance(message, list):
        # message has to be a list
        return False

    if not message:
        # message must contain at least one element
        return False

    for element in message:
        if not isinstance(element, dict):
            # All elements have to be a dict
            return False
    # TODO: There could be more checks. For example 'users' has to be a list of int
    #       Check could be done with json-schema:
    #       https://pypi.org/project/jsonschema/
    return True
