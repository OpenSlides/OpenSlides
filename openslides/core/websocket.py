from typing import Any, Dict, Optional

from ..utils.auth import async_has_perm
from ..utils.constants import get_constants
from ..utils.projector import get_projector_data
from ..utils.stats import WebsocketLatencyLogger
from ..utils.websocket import (
    WEBSOCKET_NOT_AUTHORIZED,
    BaseWebsocketClientMessage,
    ProtocollAsyncJsonWebsocketConsumer,
)


class NotifyWebsocketClientMessage(BaseWebsocketClientMessage):
    """
    Websocket message from a client to send a message to other clients.
    """

    identifier = "notify"
    schema = {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "Notify element.",
        "description": "Element that one client can send to one or many other clients.",
        "type": "object",
        "properties": {
            "name": {"description": "The name of the notify message", "type": "string"},
            "content": {"description": "The actual content of this message."},
            "reply_channels": {
                "description": "A list of channels to send this message to.",
                "type": "array",
                "items": {"type": "string"},
            },
            "users": {
                "anyOf": [
                    {
                        "description": "A list of user ids to send this message to.",
                        "type": "array",
                        "items": {"type": "integer"},
                    },
                    {
                        "description": "This flag indicates, that this message should be send to all users.",
                        "enum": [True],
                    },
                ]
            },
        },
        "required": ["name", "content"],
    }
    # Define a required permission for a notify message here. If the emitting user does not
    # have this permission, he will get an error message in response.
    notify_permissions: Dict[str, str] = {"swCheckForUpdate": "superadmin"}

    async def receive_content(
        self, consumer: "ProtocollAsyncJsonWebsocketConsumer", content: Any, id: str
    ) -> None:
        # Check if the user is allowed to send this notify message
        perm = self.notify_permissions.get(content["name"])
        if perm is not None and not await async_has_perm(
            consumer.scope["user"]["id"], perm
        ):
            await consumer.send_error(
                code=WEBSOCKET_NOT_AUTHORIZED,
                message=f"You need '{perm}' to send this message.",
                in_response=id,
            )
        else:
            # Forward to all other active site consumers to handle the notify message.
            await consumer.channel_layer.group_send(
                "site",
                {
                    "type": "send_notify",
                    "incomming": content,
                    "senderChannelName": consumer.channel_name,
                    "senderUserId": consumer.scope["user"]["id"],
                },
            )


class ConstantsWebsocketClientMessage(BaseWebsocketClientMessage):
    """
    The Client requests the constants.
    """

    identifier = "constants"
    content_required = False

    async def receive_content(
        self, consumer: "ProtocollAsyncJsonWebsocketConsumer", content: Any, id: str
    ) -> None:
        # Return all constants to the client.
        await consumer.send_json(
            type="constants", content=get_constants(), in_response=id
        )


class GetElementsWebsocketClientMessage(BaseWebsocketClientMessage):
    """
    The Client request database elements.
    """

    identifier = "getElements"
    schema = {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "titel": "getElement request",
        "description": "Request from the client to server to get elements.",
        "type": "object",
        "properties": {
            # change_id is not required
            "change_id": {"type": "integer"}
        },
    }

    async def receive_content(
        self, consumer: "ProtocollAsyncJsonWebsocketConsumer", content: Any, id: str
    ) -> None:
        requested_change_id = content.get("change_id", 0)
        await consumer.send_autoupdate(requested_change_id, in_response=id)


class AutoupdateWebsocketClientMessage(BaseWebsocketClientMessage):
    """
    The Client turns autoupdate on or off.
    """

    identifier = "autoupdate"

    async def receive_content(
        self, consumer: "ProtocollAsyncJsonWebsocketConsumer", content: Any, id: str
    ) -> None:
        # Turn on or off the autoupdate for the client
        if content:  # accept any value, that can be interpreted as bool
            await consumer.channel_layer.group_add("autoupdate", consumer.channel_name)
        else:
            await consumer.channel_layer.group_discard(
                "autoupdate", consumer.channel_name
            )


class ListenToProjectors(BaseWebsocketClientMessage):
    """
    The client tells, to which projector it listens.

    Therefor it sends a list of projector ids. If it sends an empty list, it does
    not want to get any projector information.
    """

    identifier = "listenToProjectors"
    schema = {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "titel": "Listen to projectors",
        "description": "Listen to zero, one or more projectors..",
        "type": "object",
        "properties": {
            "projector_ids": {
                "type": "array",
                "items": {"type": "integer"},
                "uniqueItems": True,
            }
        },
        "required": ["projector_ids"],
    }

    async def receive_content(
        self, consumer: "ProtocollAsyncJsonWebsocketConsumer", content: Any, id: str
    ) -> None:
        consumer.listen_projector_ids = content["projector_ids"]
        if consumer.listen_projector_ids:
            # listen to projector group
            await consumer.channel_layer.group_add("projector", consumer.channel_name)
        else:
            # do not listen to projector group
            await consumer.channel_layer.group_discard(
                "projector", consumer.channel_name
            )

        # Send projector data
        if consumer.listen_projector_ids:
            projector_data = await get_projector_data(consumer.listen_projector_ids)
            for projector_id, data in projector_data.items():
                consumer.projector_hash[projector_id] = hash(str(data))

            await consumer.send_json(
                type="projector", content=projector_data, in_response=id
            )


class PingPong(BaseWebsocketClientMessage):
    """
    Responds to pings from the client.
    """

    identifier = "ping"
    schema = {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "titel": "PingPong",
        "description": "Does a ping pong handshake",
        "anyOf": [{"type": "number"}, {"type": "null"}],
    }

    async def receive_content(
        self,
        consumer: "ProtocollAsyncJsonWebsocketConsumer",
        latency: Optional[int],
        id: str,
    ) -> None:
        await consumer.send_json(type="pong", content=latency, in_response=id)
        if latency is not None:
            await WebsocketLatencyLogger.add_latency(latency)
