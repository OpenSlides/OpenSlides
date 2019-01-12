from collections import defaultdict
from typing import Any, Dict, List
from urllib.parse import parse_qs

from .auth import async_anonymous_is_enabled
from .autoupdate import AutoupdateFormat
from .cache import element_cache, split_element_id
from .websocket import ProtocollAsyncJsonWebsocketConsumer, get_element_data


class SiteConsumer(ProtocollAsyncJsonWebsocketConsumer):
    """
    Websocket Consumer for the site.
    """

    groups = ["site"]

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        self.projector_hash: Dict[int, int] = {}
        super().__init__(*args, **kwargs)

    async def connect(self) -> None:
        """
        A user connects to the site.

        If it is an anonymous user and anonymous is disabled, the connection is closed.

        Sends the startup data to the user.
        """
        # self.scope['user'] is the full_data dict of the user. For an
        # anonymous user is it the dict {'id': 0}
        change_id = None
        if not await async_anonymous_is_enabled() and not self.scope["user"]["id"]:
            await self.close()
            return

        query_string = parse_qs(self.scope["query_string"])
        if b"change_id" in query_string:
            try:
                change_id = int(query_string[b"change_id"][0])
            except ValueError:
                await self.close()  # TODO: Find a way to send an error code
                return

        if b"autoupdate" in query_string and query_string[b"autoupdate"][
            0
        ].lower() not in [b"0", b"off", b"false"]:
            # a positive value in autoupdate. Start autoupdate
            await self.channel_layer.group_add("autoupdate", self.channel_name)

        await self.accept()

        if change_id is not None:
            try:
                data = await get_element_data(self.scope["user"]["id"], change_id)
            except ValueError:
                # When the change_id is to big, do nothing
                pass
            else:
                await self.send_json(type="autoupdate", content=data)

    async def disconnect(self, close_code: int) -> None:
        """
        A user disconnects. Remove it from autoupdate.
        """
        await self.channel_layer.group_discard("autoupdate", self.channel_name)

    async def send_notify(self, event: Dict[str, Any]) -> None:
        """
        Send a notify message to the user.
        """
        user_id = self.scope["user"]["id"]

        out = []
        for item in event["incomming"]:
            users = item.get("users")
            reply_channels = item.get("replyChannels")
            if (
                (isinstance(users, list) and user_id in users)
                or (
                    isinstance(reply_channels, list)
                    and self.channel_name in reply_channels
                )
                or users is None
                and reply_channels is None
            ):
                item["senderReplyChannelName"] = event.get("senderReplyChannelName")
                item["senderUserId"] = event.get("senderUserId")
                out.append(item)

        if out:
            await self.send_json(type="notify", content=out)

    async def send_data(self, event: Dict[str, Any]) -> None:
        """
        Send changed or deleted elements to the user.
        """
        change_id = event["change_id"]
        changed_elements, deleted_elements_ids = await element_cache.get_restricted_data(
            self.scope["user"]["id"], change_id, max_change_id=change_id
        )

        deleted_elements: Dict[str, List[int]] = defaultdict(list)
        for element_id in deleted_elements_ids:
            collection_string, id = split_element_id(element_id)
            deleted_elements[collection_string].append(id)
        await self.send_json(
            type="autoupdate",
            content=AutoupdateFormat(
                changed=changed_elements,
                deleted=deleted_elements,
                from_change_id=change_id,
                to_change_id=change_id,
                all_data=False,
            ),
        )

    async def projector_changed(self, event: Dict[str, Any]) -> None:
        """
        The projector has changed.
        """
        all_projector_data = event["data"]
        projector_data: Dict[int, Dict[str, Any]] = {}
        for projector_id in self.listen_projector_ids:
            data = all_projector_data.get(
                projector_id, {"error": f"No data for projector {projector_id}"}
            )
            new_hash = hash(str(data))
            if new_hash != self.projector_hash[projector_id]:
                projector_data[projector_id] = data
                self.projector_hash[projector_id] = new_hash

        if projector_data:
            await self.send_json(type="projector", content=projector_data)
