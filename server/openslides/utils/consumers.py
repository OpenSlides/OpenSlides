import time
from typing import Any, Dict, List, Optional, cast
from urllib.parse import parse_qs

from channels.generic.websocket import AsyncWebsocketConsumer

from . import logging
from .auth import UserDoesNotExist, async_anonymous_is_enabled
from .cache import element_cache
from .consumer_autoupdate_strategy import ConsumerAutoupdateStrategy
from .utils import get_worker_id
from .websocket import BaseWebsocketException, ProtocollAsyncJsonWebsocketConsumer


logger = logging.getLogger("openslides.websocket")


class SiteConsumer(ProtocollAsyncJsonWebsocketConsumer):
    """
    Websocket Consumer for the site.
    """

    groups = ["site"]

    ID_COUNTER = 0
    """
    ID counter for assigning each instance of this class an unique id.
    """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        self.projector_hash: Dict[int, int] = {}
        SiteConsumer.ID_COUNTER += 1
        self._id = get_worker_id() + "-" + str(SiteConsumer.ID_COUNTER)
        self.autoupdate_strategy = ConsumerAutoupdateStrategy(self)
        super().__init__(*args, **kwargs)

    async def connect(self) -> None:
        """
        A user connects to the site.

        If it is an anonymous user and anonymous is disabled, the connection is closed.

        Sends the startup data to the user.
        """
        self.user_id = self.scope["user"]["id"]

        self.connect_time = time.time()
        # self.scope['user'] is the full_data dict of the user. For an
        # anonymous user is it the dict {'id': 0}
        change_id = None
        if not await async_anonymous_is_enabled() and not self.user_id:
            await self.accept()  # workaround for #4009
            await self.close()
            logger.debug(f"connect: denied ({self._id})")
            return

        query_string = cast(
            Dict[bytes, List[bytes]], parse_qs(self.scope["query_string"])
        )
        if b"change_id" in query_string:
            try:
                change_id = int(query_string[b"change_id"][0])
            except ValueError:
                await self.accept()  # workaround for #4009
                await self.close()
                logger.debug(f"connect: wrong change id ({self._id})")
                return

        await self.accept()

        if change_id is not None:
            logger.debug(f"connect: change id {change_id} ({self._id})")
            try:
                await self.request_autoupdate(change_id)
            except BaseWebsocketException as e:
                await self.send_exception(e)
        else:
            logger.debug(f"connect: no change id ({self._id})")

        await self.channel_layer.group_add("autoupdate", self.channel_name)

    async def disconnect(self, close_code: int) -> None:
        """
        A user disconnects. Remove it from autoupdate.
        """
        await self.channel_layer.group_discard("autoupdate", self.channel_name)
        active_seconds = int(time.time() - self.connect_time)
        logger.debug(
            f"disconnect code={close_code} active_secs={active_seconds} ({self._id})"
        )

    async def msg_new_change_id(self, event: Dict[str, Any]) -> None:
        """
        Send changed or deleted elements to the user.
        """
        change_id = event["change_id"]
        try:
            await self.autoupdate_strategy.new_change_id(change_id)
        except UserDoesNotExist:
            # Maybe the user was deleted, but a websocket connection is still open to the user.
            # So we can close this connection and return.
            await self.close()

    async def msg_projector_data(self, event: Dict[str, Any]) -> None:
        """
        The projector has changed.
        """
        all_projector_data = event["data"]
        change_id = event["change_id"]

        projector_data: Dict[int, Dict[str, Any]] = {}
        for projector_id in self.listen_projector_ids:
            data = all_projector_data.get(projector_id, [])
            new_hash = hash(str(data))
            if new_hash != self.projector_hash.get(projector_id):
                projector_data[projector_id] = data
                self.projector_hash[projector_id] = new_hash

        if projector_data:
            await self.send_projector_data(projector_data, change_id=change_id)

    async def msg_notify(self, event: Dict[str, Any]) -> None:
        """
        Send a notify message to the user.
        """
        item = event["incomming"]

        users = item.get("users")
        reply_channels = item.get("replyChannels")
        if (
            (isinstance(users, bool) and users)
            or (isinstance(users, list) and self.user_id in users)
            or (
                isinstance(reply_channels, list) and self.channel_name in reply_channels
            )
            or (users is None and reply_channels is None)
        ):
            item["senderChannelName"] = event["senderChannelName"]
            item["senderUserId"] = event["senderUserId"]
            await self.send_json(type="notify", content=item)

    async def request_autoupdate(
        self, change_id: int, in_response: Optional[str] = None
    ) -> None:
        await self.autoupdate_strategy.request_change_id(
            change_id, in_response=in_response
        )

    async def send_projector_data(
        self,
        data: Dict[int, Dict[str, Any]],
        change_id: Optional[int] = None,
        in_response: Optional[str] = None,
    ) -> None:
        """
        Sends projector data to the consumer.
        """
        if change_id is None:
            change_id = await element_cache.get_current_change_id()

        content = {"change_id": change_id, "data": data}
        await self.send_json(type="projector", content=content, in_response=in_response)


class CloseConsumer(AsyncWebsocketConsumer):
    """ Auto-closes the connection """

    groups: List[str] = []

    def __init__(self, args: Dict[str, Any], **kwargs: Any) -> None:
        logger.info(f'Closing connection to unknown websocket url {args["path"]}')

    async def connect(self) -> None:
        await self.accept()
        await self.close()
