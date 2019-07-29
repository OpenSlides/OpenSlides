import json

import lz4.frame
from channels.testing import WebsocketCommunicator as ChannelsWebsocketCommunicator


class WebsocketCommunicator(ChannelsWebsocketCommunicator):
    """
    Implements decompression when receiving JSON data.
    """

    async def receive_json_from(self, timeout=1):
        """
        Receives a JSON text frame or a compressed JSON bytes object, decompresses and decodes it
        """
        payload = await self.receive_from(timeout)
        if isinstance(payload, bytes):
            # try to decompress the message
            uncompressed_data = lz4.frame.decompress(payload)
            text_data = uncompressed_data.decode("utf-8")
        else:
            text_data = payload

        assert isinstance(text_data, str), "JSON data is not a text frame"
        return json.loads(text_data)

    async def assert_receive_error(self, timeout=1, in_response=None, **kwargs):
        response = await self.receive_json_from(timeout)
        assert response["type"] == "error"

        content = response.get("content")
        if kwargs:
            assert content
        for key, value in kwargs.items():
            assert content.get(key) == value

        if in_response:
            assert response["in_response"] == in_response
