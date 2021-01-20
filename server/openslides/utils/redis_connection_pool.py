# type: ignore
import asyncio
import sys
import types
from typing import Any, Dict, List, Optional

import aioredis
from django.conf import settings

from . import logging


logger = logging.getLogger(__name__)
connection_pool_limit = getattr(settings, "CONNECTION_POOL_LIMIT", 10)
logger.info(f"CONNECTION_POOL_LIMIT={connection_pool_limit}")


# Copied from https://github.com/django/channels_redis/blob/master/channels_redis/core.py
# and renamed..

AIOREDIS_VERSION = tuple(map(int, aioredis.__version__.split(".")))


def _wrap_close(loop, pool):
    """
    Decorate an event loop's close method with our own.
    """
    original_impl = loop.close

    def _wrapper(self, *args, **kwargs):
        # If the event loop was closed, there's nothing we can do anymore.
        if not self.is_closed():
            self.run_until_complete(pool.close_loop(self))
        # Restore the original close() implementation after we're done.
        self.close = original_impl
        return self.close(*args, **kwargs)

    loop.close = types.MethodType(_wrapper, loop)


class ChannelRedisConnectionPool:
    """
    Connection pool manager for the channel layer.
    It manages a set of connections for the given host specification and
    taking into account asyncio event loops.
    """

    def __init__(self, host):
        self.host = host
        self.conn_map = {}
        self.in_use = {}

    def _ensure_loop(self, loop):
        """
        Get connection list for the specified loop.
        """
        if loop is None:
            loop = asyncio.get_event_loop()

        if loop not in self.conn_map:
            # Swap the loop's close method with our own so we get
            # a chance to do some cleanup.
            _wrap_close(loop, self)
            self.conn_map[loop] = []

        return self.conn_map[loop], loop

    async def pop(self, loop=None):
        """
        Get a connection for the given identifier and loop.
        """
        conns, loop = self._ensure_loop(loop)
        if not conns:
            if sys.version_info >= (3, 8, 0) and AIOREDIS_VERSION >= (1, 3, 1):
                conn = await aioredis.create_redis(**self.host)
            else:
                conn = await aioredis.create_redis(**self.host, loop=loop)
            conns.append(conn)
        conn = conns.pop()
        if conn.closed:
            conn = await self.pop(loop=loop)
            return conn
        self.in_use[conn] = loop
        return conn

    def push(self, conn):
        """
        Return a connection to the pool.
        """
        loop = self.in_use[conn]
        del self.in_use[conn]
        if loop is not None:
            conns, _ = self._ensure_loop(loop)
            conns.append(conn)

    def conn_error(self, conn):
        """
        Handle a connection that produced an error.
        """
        conn.close()
        del self.in_use[conn]

    def reset(self):
        """
        Clear all connections from the pool.
        """
        self.conn_map = {}
        self.in_use = {}

    async def close_loop(self, loop):
        """
        Close all connections owned by the pool on the given loop.
        """
        if loop in self.conn_map:
            for conn in self.conn_map[loop]:
                conn.close()
                await conn.wait_closed()
            del self.conn_map[loop]

        for k, v in self.in_use.items():
            if v is loop:
                self.in_use[k] = None

    async def close(self):
        """
        Close all connections owned by the pool.
        """
        conn_map = self.conn_map
        in_use = self.in_use
        self.reset()
        for conns in conn_map.values():
            for conn in conns:
                conn.close()
                await conn.wait_closed()
        for conn in in_use:
            conn.close()
            await conn.wait_closed()


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
