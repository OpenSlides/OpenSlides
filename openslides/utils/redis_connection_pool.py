import asyncio
from typing import Any, Dict, List

import aioredis
from channels_redis.core import ConnectionPool as ChannelRedisConnectionPool
from django.conf import settings

from . import logging


logger = logging.getLogger(__name__)
connection_pool_limit = getattr(settings, "CONNECTION_POOL_LIMIT", 100)
logger.info(f"CONNECTION_POOL_LIMIT={connection_pool_limit}")


class ConnectionPool(ChannelRedisConnectionPool):
    """ Adds a trivial, soft limit for the pool """

    def __init__(self, host: Any) -> None:
        self.counter = 0
        super().__init__(host)

    async def pop(
        self, *args: List[Any], **kwargs: Dict[str, Any]
    ) -> aioredis.commands.Redis:
        while self.counter > connection_pool_limit:
            await asyncio.sleep(0.1)
        self.counter += 1

        return await super().pop(*args, **kwargs)

    def push(self, conn: aioredis.commands.Redis) -> None:
        super().push(conn)
        self.counter -= 1

    def conn_error(self, conn: aioredis.commands.Redis) -> None:
        super().conn_error(conn)
        self.counter -= 1

    def reset(self) -> None:
        super().reset()
        self.counter = 0
