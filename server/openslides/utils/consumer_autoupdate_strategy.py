import asyncio
from asyncio import Task
from typing import Optional, cast

from django.conf import settings

from .autoupdate import get_autoupdate_data
from .cache import element_cache
from .websocket import ChangeIdTooHighException, ProtocollAsyncJsonWebsocketConsumer


AUTOUPDATE_DELAY = getattr(settings, "AUTOUPDATE_DELAY", None)


class ConsumerAutoupdateStrategy:
    def __init__(self, consumer: ProtocollAsyncJsonWebsocketConsumer) -> None:
        self.consumer = consumer
        # client_change_id = None: unknown -> set on first autoupdate or request_change_id
        # client_change_id is int: the change_id, the client knows about, so the next
        # update must be from client_change_id+1 .. <next clange_id>
        self.client_change_id: Optional[int] = None
        self.next_send_time = None
        self.timer_task_handle: Optional[Task[None]] = None
        self.lock = asyncio.Lock()

    async def request_change_id(
        self, change_id: int, in_response: Optional[str] = None
    ) -> None:
        """
        The change id is not inclusive, so the client is on change_id and wants
        data from change_id+1 .. now
        """
        # This resets the server side tracking of the client's change id.
        async with self.lock:
            await self.stop_timer()

            max_change_id = await element_cache.get_current_change_id()
            self.client_change_id = change_id

            if self.client_change_id == max_change_id:
                # The client is up-to-date, so nothing will be done
                return None

            if self.client_change_id > max_change_id:
                message = (
                    f"Requested change_id {self.client_change_id} is higher than the "
                    + f"highest change_id {max_change_id}."
                )
                raise ChangeIdTooHighException(message, in_response=in_response)

            await self.send_autoupdate(in_response=in_response)

    async def new_change_id(self, change_id: int) -> None:
        async with self.lock:
            if self.client_change_id is None:
                # The -1 is to send this autoupdate as the first one to he client.
                # Remember: the client_change_id is the change_id the client knows about
                self.client_change_id = change_id - 1

            if AUTOUPDATE_DELAY is None:  # feature deactivated, send directly
                await self.send_autoupdate()
            elif self.timer_task_handle is None:
                await self.start_timer()

    async def get_running_loop(self) -> asyncio.AbstractEventLoop:
        if hasattr(asyncio, "get_running_loop"):
            return asyncio.get_running_loop()  # type: ignore
        else:
            return asyncio.get_event_loop()

    async def start_timer(self) -> None:
        loop = await self.get_running_loop()
        self.timer_task_handle = loop.create_task(self.timer_task())

    async def stop_timer(self) -> None:
        if self.timer_task_handle is not None:
            self.timer_task_handle.cancel()
        self.timer_task_handle = None

    async def timer_task(self) -> None:
        try:
            await asyncio.sleep(AUTOUPDATE_DELAY)
        except asyncio.CancelledError:
            return

        async with self.lock:
            await self.send_autoupdate()
            self.timer_task_handle = None

    async def send_autoupdate(self, in_response: Optional[str] = None) -> None:
        # here, 1 is added to the change_id, because the client_change_id is the id the client
        # *knows* about -> the client needs client_change_id+1 since get_autoupdate_data is
        # inclusive [change_id .. max_change_id].
        max_change_id, autoupdate = await get_autoupdate_data(
            cast(int, self.client_change_id) + 1, self.consumer.user_id
        )
        if autoupdate is not None:
            self.client_change_id = max_change_id
            # It will be send, so we can set the client_change_id
            await self.consumer.send_json(
                type="autoupdate", content=autoupdate, in_response=in_response
            )
