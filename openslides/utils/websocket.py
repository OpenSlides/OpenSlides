import json
from collections import defaultdict
from typing import Any, Dict, List, Optional

import jsonschema
import lz4.frame
from channels.generic.websocket import AsyncWebsocketConsumer
from django.conf import settings
from websockets.exceptions import ConnectionClosed

from .autoupdate import AutoupdateFormat
from .cache import element_cache
from .stats import WebsocketThroughputLogger
from .utils import split_element_id


# Custom Websocket error codes (not to be confused with the websocket *connection*
# status codes like 1000 or 1006. These are custom ones for OpenSlides to give a
# machine parseable response, so the client can react on errors.

WEBSOCKET_NOT_AUTHORIZED = 100
# E.g. if a user does not have the right permission(s) for a message.

WEBSOCKET_CHANGE_ID_TOO_HIGH = 101
# If data is requested and the given change id is higher than the highest change id
# from the element_cache.

WEBSOCKET_WRONG_FORMAT = 10
# If the recieved data has not the expected format.


class AsyncCompressedJsonWebsocketConsumer(AsyncWebsocketConsumer):
    async def receive(
        self,
        text_data: Optional[str] = None,
        bytes_data: Optional[bytes] = None,
        **kwargs: Dict[str, Any],
    ) -> None:
        if bytes_data:
            uncompressed_data = lz4.frame.decompress(bytes_data)
            text_data = uncompressed_data.decode("utf-8")

            recv_len = len(bytes_data)
            uncompressed_len = len(uncompressed_data)
            await WebsocketThroughputLogger.receive(uncompressed_len, recv_len)
        elif text_data:
            uncompressed_len = len(text_data.encode("utf-8"))
            await WebsocketThroughputLogger.receive(uncompressed_len)

        if text_data:
            await self.receive_json(json.loads(text_data), **kwargs)

    async def send_json(self, content: Any, close: bool = False) -> None:
        text_data = json.dumps(content)

        b_text_data = text_data.encode("utf-8")
        uncompressed_len = len(b_text_data)
        await WebsocketThroughputLogger.send(uncompressed_len)

        await self.send(text_data=text_data, close=close)

    async def receive_json(self, content: str, **kwargs: Dict[str, Any]) -> None:
        pass


class ProtocollAsyncJsonWebsocketConsumer(AsyncCompressedJsonWebsocketConsumer):
    """
    Mixin for JSONWebsocketConsumers, that speaks the a special protocol.
    """

    async def send_json(  # type: ignore
        self,
        type: str,
        content: Any,
        id: Optional[str] = None,
        in_response: Optional[str] = None,
        silence_errors: Optional[bool] = True,
    ) -> None:
        """
        Sends the data with the type.
        If silence_errors is True (default), all ConnectionClosed
        and runtime errors during sending will be ignored.
        """
        out = {"type": type, "content": content}
        if id:
            out["id"] = id
        if in_response:
            out["in_response"] = in_response
        try:
            await super().send_json(out)
        except (ConnectionClosed, RuntimeError) as e:
            # The ConnectionClosed error is thrown by the websocket lib: websocket/protocol.py in ensure_open
            # `websockets.exceptions.ConnectionClosed: WebSocket connection is closed: code = 1005
            #  (no status code [internal]), no reason` (Also with other codes)
            # The RuntimeError is thrown by uvicorn: uvicorn/protocols/websockets/websockets_impl.py in asgi_send
            # `RuntimeError: Unexpected ASGI message 'websocket.send', after sending 'websocket.close'`
            if not silence_errors:
                raise e

    async def send_error(
        self,
        code: int,
        message: str,
        in_response: Optional[str] = None,
        silence_errors: Optional[bool] = True,
    ) -> None:
        """
        Send generic error messages with a custom status code (see above) and a text message.
        """
        await self.send_json(
            "error",
            {"code": code, "message": message},
            None,
            in_response=in_response,
            silence_errors=silence_errors,
        )

    async def receive_json(self, content: Any) -> None:  # type: ignore
        """
        Receives the json data, parses it and calls receive_content.
        """
        try:
            jsonschema.validate(content, schema)
        except jsonschema.ValidationError as err:
            try:
                in_response = content["id"]
            except (TypeError, KeyError):
                # content is not a dict (TypeError) or has not the key id (KeyError)
                in_response = None

            await self.send_error(
                code=WEBSOCKET_WRONG_FORMAT, message=str(err), in_response=in_response
            )
            return

        await websocket_client_messages[content["type"]].receive_content(
            self, content["content"], id=content["id"]
        )


schema: Dict[str, Any] = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "OpenSlidesWebsocketProtocol",
    "description": "The packages that OpenSlides sends between the server and the client.",
    "type": "object",
    "properties": {
        "type": {
            "description": "Defines what kind of packages is packed.",
            "type": "string",
        },
        "content": {"description": "The content of the package."},
        "id": {"description": "An identifier of the package.", "type": "string"},
        "in_response": {
            "description": "The id of another package that the other part sent before.",
            "type": "string",
        },
    },
    "required": ["type", "content", "id"],
    "anyOf": [],  # This will be filled in register_client_message()
}


class BaseWebsocketClientMessage:
    schema: Dict[str, object] = {}
    """
    Optional schema.

    If schema is not set, any value in content is accepted.
    """

    identifier: str = ""
    """
    A unique identifier for the websocket message.

    This is used as value in the 'type' property in the websocket message.
    """

    content_required = True
    """
    Desiedes, if the content property is required.
    """

    async def receive_content(
        self, consumer: "ProtocollAsyncJsonWebsocketConsumer", message: Any, id: str
    ) -> None:
        raise NotImplementedError(
            "WebsocketClientMessage needs the method receive_content()."
        )


websocket_client_messages: Dict[str, BaseWebsocketClientMessage] = {}
"""
Saves all websocket client message object ordered by there identifier.
"""


def register_client_message(
    websocket_client_message: BaseWebsocketClientMessage
) -> None:
    """
    Registers one websocket client message class.
    """
    if (
        not websocket_client_message.identifier
        or websocket_client_message.identifier in websocket_client_messages
    ):
        raise NotImplementedError("WebsocketClientMessage needs a unique identifier.")

    websocket_client_messages[
        websocket_client_message.identifier
    ] = websocket_client_message

    # Add the message schema to the schema
    message_schema: Dict[str, Any] = {
        "properties": {
            "type": {"const": websocket_client_message.identifier},
            "content": websocket_client_message.schema,
        }
    }
    if websocket_client_message.content_required:
        message_schema["required"] = ["content"]

    schema["anyOf"].append(message_schema)


async def get_element_data(user_id: int, change_id: int = 0) -> AutoupdateFormat:
    """
    Returns all element data since a change_id.
    """
    current_change_id = await element_cache.get_current_change_id()
    if change_id > current_change_id:
        raise ValueError(
            f"Requested change_id {change_id} is higher this highest change_id {current_change_id}."
        )
    try:
        changed_elements, deleted_element_ids = await element_cache.get_restricted_data(
            user_id, change_id, current_change_id
        )
    except RuntimeError:
        # The change_id is lower the the lowerst change_id in redis. Return all data
        changed_elements = await element_cache.get_all_restricted_data(user_id)
        all_data = True
        deleted_elements: Dict[str, List[int]] = {}
    else:
        all_data = False
        deleted_elements = defaultdict(list)
        for element_id in deleted_element_ids:
            collection_string, id = split_element_id(element_id)
            deleted_elements[collection_string].append(id)

    return AutoupdateFormat(
        changed=changed_elements,
        deleted=deleted_elements,
        from_change_id=change_id,
        to_change_id=current_change_id,
        all_data=all_data,
    )
