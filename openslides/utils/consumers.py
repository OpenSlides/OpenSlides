import time
from collections import defaultdict
from typing import Any, Dict, List, Optional
from urllib.parse import parse_qs

from ..utils.websocket import WEBSOCKET_CHANGE_ID_TOO_HIGH
from . import logging
from .auth import async_anonymous_is_enabled
from .autoupdate import AutoupdateFormat
from .cache import ChangeIdTooLowError, element_cache, split_element_id
from .utils import get_worker_id
from .websocket import ProtocollAsyncJsonWebsocketConsumer


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

    skipped_autoupdate_from_change_id: Optional[int] = None

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        self.projector_hash: Dict[int, int] = {}
        SiteConsumer.ID_COUNTER += 1
        self._id = get_worker_id() + "-" + str(SiteConsumer.ID_COUNTER)
        super().__init__(*args, **kwargs)

    async def connect(self) -> None:
        """
        A user connects to the site.

        If it is an anonymous user and anonymous is disabled, the connection is closed.

        Sends the startup data to the user.
        """
        self.connect_time = time.time()
        # self.scope['user'] is the full_data dict of the user. For an
        # anonymous user is it the dict {'id': 0}
        change_id = None
        if not await async_anonymous_is_enabled() and not self.scope["user"]["id"]:
            await self.accept()  # workaround for #4009
            await self.close()
            logger.debug(f"connect: denied ({self._id})")
            return

        query_string = parse_qs(self.scope["query_string"])
        if b"change_id" in query_string:
            try:
                change_id = int(query_string[b"change_id"][0])
            except ValueError:
                await self.accept()  # workaround for #4009
                await self.close()  # TODO: Find a way to send an error code
                logger.debug(f"connect: wrong change id ({self._id})")
                return

        if b"autoupdate" in query_string and query_string[b"autoupdate"][
            0
        ].lower() not in [b"0", b"off", b"false"]:
            # a positive value in autoupdate. Start autoupdate
            await self.channel_layer.group_add("autoupdate", self.channel_name)

        await self.accept()

        if change_id is not None:
            logger.debug(f"connect: change id {change_id} ({self._id})")
            await self.send_autoupdate(change_id)
        else:
            logger.debug(f"connect: no change id ({self._id})")

    async def disconnect(self, close_code: int) -> None:
        """
        A user disconnects. Remove it from autoupdate.
        """
        await self.channel_layer.group_discard("autoupdate", self.channel_name)
        active_seconds = int(time.time() - self.connect_time)
        logger.debug(
            f"disconnect code={close_code} active_secs={active_seconds} ({self._id})"
        )

    async def send_notify(self, event: Dict[str, Any]) -> None:
        """
        Send a notify message to the user.
        """
        user_id = self.scope["user"]["id"]
        item = event["incomming"]

        users = item.get("users")
        reply_channels = item.get("replyChannels")
        if (
            (isinstance(users, bool) and users)
            or (isinstance(users, list) and user_id in users)
            or (
                isinstance(reply_channels, list) and self.channel_name in reply_channels
            )
            or (users is None and reply_channels is None)
        ):
            item["senderChannelName"] = event["senderChannelName"]
            item["senderUserId"] = event["senderUserId"]
            await self.send_json(type="notify", content=item)

    async def send_autoupdate(
        self,
        change_id: int,
        max_change_id: Optional[int] = None,
        in_response: Optional[str] = None,
    ) -> None:
        """
        Sends an autoupdate to the client from change_id to max_change_id.
        If max_change_id is None, the current change id will be used.
        """
        user_id = self.scope["user"]["id"]

        if max_change_id is None:
            max_change_id = await element_cache.get_current_change_id()

        if change_id == max_change_id + 1:
            # The client is up-to-date, so nothing will be done
            return

        if change_id > max_change_id:
            message = f"Requested change_id {change_id} is higher this highest change_id {max_change_id}."
            await self.send_error(
                code=WEBSOCKET_CHANGE_ID_TOO_HIGH,
                message=message,
                in_response=in_response,
            )
            return

        try:
            changed_elements, deleted_element_ids = await element_cache.get_data_since(
                user_id, change_id, max_change_id
            )
        except ChangeIdTooLowError:
            # The change_id is lower the the lowerst change_id in redis. Return all data
            changed_elements = await element_cache.get_all_data_list(user_id)
            all_data = True
            deleted_elements: Dict[str, List[int]] = {}
        else:
            all_data = False
            deleted_elements = defaultdict(list)
            for element_id in deleted_element_ids:
                collection_string, id = split_element_id(element_id)
                deleted_elements[collection_string].append(id)

        # Check, if the autoupdate has any data.
        if not changed_elements and not deleted_element_ids:
            # Set the current from_change_id, if it is the first skipped autoupdate
            if not self.skipped_autoupdate_from_change_id:
                self.skipped_autoupdate_from_change_id = change_id
        else:
            # Normal autoupdate with data
            from_change_id = change_id

            # If there is at least one skipped autoupdate, take the saved from_change_id
            if self.skipped_autoupdate_from_change_id:
                from_change_id = self.skipped_autoupdate_from_change_id
                self.skipped_autoupdate_from_change_id = None

            await self.send_json(
                type="autoupdate",
                content=AutoupdateFormat(
                    changed=changed_elements,
                    deleted=deleted_elements,
                    from_change_id=from_change_id,
                    to_change_id=max_change_id,
                    all_data=all_data,
                ),
                in_response=in_response,
            )

    async def send_data(self, event: Dict[str, Any]) -> None:
        """
        Send changed or deleted elements to the user.
        """
        change_id = event["change_id"]
        await self.send_autoupdate(change_id, max_change_id=change_id)

    async def projector_changed(self, event: Dict[str, Any]) -> None:
        """
        The projector has changed.
        """
        all_projector_data = event["data"]
        projector_data: Dict[int, Dict[str, Any]] = {}
        for projector_id in self.listen_projector_ids:
            data = all_projector_data.get(projector_id, [])
            new_hash = hash(str(data))
            if new_hash != self.projector_hash.get(projector_id):
                projector_data[projector_id] = data
                self.projector_hash[projector_id] = new_hash

        if projector_data:
            await self.send_json(type="projector", content=projector_data)
