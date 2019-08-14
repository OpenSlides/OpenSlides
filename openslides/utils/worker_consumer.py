import asyncio
import logging
from collections import defaultdict
from typing import Any, Dict, List, Optional

from channels.layers import get_channel_layer

from .autoupdate import AutoupdateFormat
from .cache import element_cache
from .projector import get_projector_data
from .utils import split_element_id
from .websocket import ProtocollAsyncJsonWebsocketConsumer


logger = logging.getLogger(__name__)


class WorkerConsumer:
    group_name = "workers"
    consumers: Dict[str, ProtocollAsyncJsonWebsocketConsumer] = {}
    _setup = False
    projector_hash: Dict[int, int] = {}

    async def setup(
        self, event_loop: Optional[asyncio.AbstractEventLoop] = None
    ) -> Optional[asyncio.Task]:
        if self._setup:
            return None

        self.channel_layer = get_channel_layer()
        self._setup = True
        self.channel_name = await self.channel_layer.new_channel()
        await self.channel_layer.group_add(self.group_name, self.channel_name)

        if event_loop is None:
            if hasattr(asyncio, "get_running_loop"):
                # new and preferred for python 3.7
                event_loop = asyncio.get_running_loop()
            else:
                event_loop = asyncio.get_event_loop()  # legacy
        return event_loop.create_task(self.receive())

    async def receive(self) -> None:
        while True:
            message = await self.channel_layer.receive(self.channel_name)
            if message.get("type") == "autoupdate":
                await self.handle_autoupdate(message["change_id"])
            else:
                logger.warn(f"unknown message for worker: {message}")

    async def handle_autoupdate(self, change_id: int) -> None:
        changed_elements, deleted_element_ids = await element_cache.get_data_since(
            change_id=change_id, max_change_id=change_id
        )
        changed_projector_data = await self.get_changed_projector_data()

        # TODO: group consumers per user_id -> restrict the data once per user.
        futures = []
        for consumer in self.consumers.values():
            # copy changed_elements and deleted_element_ids
            if consumer.autoupdates_enabled:
                _changed_elements = {
                    key: [x for x in value] for key, value in changed_elements.items()
                }
                _deleted_element_ids = [x for x in deleted_element_ids]

                # Send autoupdate and possible projector data
                futures.append(
                    self.send_autoupdate_to_consumer(
                        consumer, change_id, _changed_elements, _deleted_element_ids
                    )
                )

            if changed_projector_data:
                futures.append(
                    self.send_projector_data_to_consumer(
                        consumer, changed_projector_data
                    )
                )

        await asyncio.gather(*futures)

    async def get_changed_projector_data(self) -> Dict[int, List[Dict[str, Any]]]:
        """
        Get all projector data and calculates the projector data. Returnes just the
        changed data in comparison to an old hash of the json string.
        """
        all_projector_data = await get_projector_data()
        projector_data: Dict[int, List[Dict[str, Any]]] = {}
        for projector_id, data in all_projector_data.items():
            new_hash = hash(str(data))
            if new_hash != self.projector_hash.get(projector_id):
                projector_data[projector_id] = data
                self.projector_hash[projector_id] = new_hash

        return projector_data

    async def send_projector_data_to_consumer(
        self,
        consumer: "ProtocollAsyncJsonWebsocketConsumer",
        changed_projector_data: Dict[int, List[Dict[str, Any]]],
    ) -> None:
        """
        Sends changed projector data to the conusmer. Just the data for the projectors,
        where the consumer listens to, is send away.
        """
        projector_data: Dict[int, List[Dict[str, Any]]] = {}
        for projector_id in consumer.listen_projector_ids:
            if projector_id in changed_projector_data:
                projector_data[projector_id] = changed_projector_data[projector_id]

        if projector_data:
            await consumer.send_json(type="projector", content=projector_data)

    async def send_autoupdate_to_consumer(
        self,
        consumer: "ProtocollAsyncJsonWebsocketConsumer",
        change_id: int,
        changed_elements: Dict[str, List[Dict[str, Any]]],
        deleted_element_ids: List[str],
    ) -> None:
        """
        Sends the restricted data to the user. Attention: The chaged-elements and deleted_element_ids
        are modified!
        """
        await element_cache.restrict(
            changed_elements, deleted_element_ids, consumer.user_id
        )

        # re-group deleted elements
        deleted_elements: Dict[str, List[int]] = defaultdict(list)
        for element_id in deleted_element_ids:
            collection_string, id = split_element_id(element_id)
            deleted_elements[collection_string].append(id)

        await consumer.send_json(
            type="autoupdate",
            content=AutoupdateFormat(
                changed=changed_elements,
                deleted=deleted_elements,
                from_change_id=change_id,
                to_change_id=change_id,
                all_data=False,
            ),
        )

    async def add_autoupdate_consumer(
        self, consumer: "ProtocollAsyncJsonWebsocketConsumer"
    ) -> None:
        await self.setup()
        self.consumers[consumer._id] = consumer

    async def remove_autoupdate_consumer(
        self, consumer: "ProtocollAsyncJsonWebsocketConsumer"
    ) -> None:
        await self.setup()
        if consumer._id in self.consumers:
            del self.consumers[consumer._id]


worker_consumer = WorkerConsumer()
