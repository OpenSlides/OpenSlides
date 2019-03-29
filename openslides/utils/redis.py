import asyncio
from typing import Any

from channels_redis.core import ConnectionPool
from django.conf import settings


try:
    import aioredis
except ImportError:
    use_redis = False
else:
    # set use_redis to true, if there is a value for REDIS_ADDRESS in the settings
    redis_address = getattr(settings, "REDIS_ADDRESS", "")
    use_redis = bool(redis_address)


pool = ConnectionPool({"address": redis_address})
semaphore = asyncio.Semaphore(100)


class RedisConnectionContextManager:
    """
    Async context manager for connections
    """

    # TODO: contextlib.asynccontextmanager can be used in python 3.7

    async def __aenter__(self) -> "aioredis.RedisConnection":
        await semaphore.acquire()
        self.conn = await pool.pop()
        return self.conn

    async def __aexit__(self, exc_type: Any, exc: Any, tb: Any) -> None:
        pool.push(self.conn)
        semaphore.release()


def get_connection() -> RedisConnectionContextManager:
    """
    Returns contextmanager for a redis connection.
    """
    return RedisConnectionContextManager()
