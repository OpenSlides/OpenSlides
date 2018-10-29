from collections import defaultdict
from typing import Any, Dict, List, Optional

import jsonschema
from channels.generic.websocket import AsyncJsonWebsocketConsumer

from .cache import element_cache
from .collection import AutoupdateFormat, CollectionElement
from .utils import split_element_id


class ProtocollAsyncJsonWebsocketConsumer(AsyncJsonWebsocketConsumer):
    """
    Mixin for JSONWebsocketConsumers, that speaks the a special protocol.
    """

    async def send_json(self, type: str, content: Any, id: Optional[str] = None, in_response: Optional[str] = None) -> None:
        """
        Sends the data with the type.
        """
        out = {'type': type, 'content': content}
        if id:
            out['id'] = id
        if in_response:
            out['in_response'] = in_response
        await super().send_json(out)

    async def receive_json(self, content: Any) -> None:
        """
        Receives the json data, parses it and calls receive_content.
        """
        try:
            jsonschema.validate(content, schema)
        except jsonschema.ValidationError as err:
            try:
                in_response = content['id']
            except (TypeError, KeyError):
                # content is not a dict (TypeError) or has not the key id (KeyError)
                in_response = None

            await self.send_json(
                type='error',
                content=str(err),
                in_response=in_response)
            return

        await websocket_client_messages[content['type']].receive_content(self, content['content'], id=content['id'])


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
        "content": {
            "description": "The content of the package.",
        },
        "id": {
            "description": "An identifier of the package.",
            "type": "string",
        },
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

    async def receive_content(self, consumer: "ProtocollAsyncJsonWebsocketConsumer", message: Any, id: str) -> None:
        raise NotImplementedError("WebsocketClientMessage needs the method receive_content().")


websocket_client_messages: Dict[str, BaseWebsocketClientMessage] = {}
"""
Saves all websocket client message object ordered by there identifier.
"""


def register_client_message(websocket_client_message: BaseWebsocketClientMessage) -> None:
    """
    Registers one websocket client message class.
    """
    if not websocket_client_message.identifier or websocket_client_message.identifier in websocket_client_messages:
        raise NotImplementedError("WebsocketClientMessage needs a unique identifier.")

    websocket_client_messages[websocket_client_message.identifier] = websocket_client_message

    # Add the message schema to the schema
    message_schema: Dict[str, Any] = {
        'properties': {
            'type': {'const': websocket_client_message.identifier},
            'content': websocket_client_message.schema,
        }
    }
    if websocket_client_message.content_required:
        message_schema['required'] = ['content']

    schema['anyOf'].append(message_schema)


async def get_element_data(user: Optional[CollectionElement], change_id: int = 0) -> AutoupdateFormat:
    """
    Returns all element data since a change_id.
    """
    current_change_id = await element_cache.get_current_change_id()
    if change_id > current_change_id:
        raise ValueError("Requested change_id is higher this highest change_id.")
    try:
        changed_elements, deleted_element_ids = await element_cache.get_restricted_data(user, change_id, current_change_id)
    except RuntimeError:
        # The change_id is lower the the lowerst change_id in redis. Return all data
        changed_elements = await element_cache.get_all_restricted_data(user)
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
        all_data=all_data)
