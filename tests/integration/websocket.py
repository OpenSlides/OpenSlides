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
