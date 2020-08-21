import asyncio
from typing import Any, Dict, List, Optional

import aioredis
from channels_redis.core import ConnectionPool as ChannelRedisConnectionPool
from django.conf import settings

from . import logging


logger = logging.getLogger(__name__)
connection_pool_limit = getattr(settings, "CONNECTION_POOL_LIMIT", 100)
logger.info(f"CONNECTION_POOL_LIMIT={connection_pool_limit}")


class InvalidConnection(Exception):
    pass


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

        return await self.pop_ensured_connection(*args, **kwargs)

    async def pop_ensured_connection(
        self, *args: List[Any], **kwargs: Dict[str, Any]
    ) -> aioredis.commands.Redis:
        redis: Optional[aioredis.commands.Redis] = None

        while redis is None:
            redis = await super().pop(*args, **kwargs)

            try:
                await self.try_ping(redis)
            except InvalidConnection:
                if redis is not None:
                    super().conn_error(redis)
                redis = None

        return redis

    async def try_ping(self, redis: aioredis.commands.Redis) -> None:
        try:
            pong = await redis.ping()
            if pong != b"PONG":
                logger.info("Redis connection invalid, did not recieve PONG")
                raise InvalidConnection()
        except (ConnectionRefusedError, ConnectionResetError):
            logger.info("Redis connection invalid, connection is bad")
            raise InvalidConnection()

    def push(self, conn: aioredis.commands.Redis) -> None:
        super().push(conn)
        self.counter -= 1

    def conn_error(self, conn: aioredis.commands.Redis) -> None:
        super().conn_error(conn)
        self.counter -= 1

    def reset(self) -> None:
        super().reset()
        self.counter = 0
