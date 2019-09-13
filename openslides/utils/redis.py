import asyncio
from typing import Any

from django.conf import settings

from . import logging


logger = logging.getLogger(__name__)

try:
    import aioredis
except ImportError:
    use_redis = False
else:
    from channels_redis.core import ConnectionPool

    # set use_redis to true, if there is a value for REDIS_ADDRESS in the settings
    redis_address = getattr(settings, "REDIS_ADDRESS", "")
    use_redis = bool(redis_address)
    if use_redis:
        logger.info(f"Redis address {redis_address}")

    pool = ConnectionPool({"address": redis_address})
    counter = 0


class RedisConnectionContextManager:
    """
    Async context manager for connections
    """

    # TODO: contextlib.asynccontextmanager can be used in python 3.7

    async def __aenter__(self) -> "aioredis.RedisConnection":
        global counter
        while counter > 100:
            await asyncio.sleep(0.1)
        counter += 1

        self.conn = await pool.pop()
        return self.conn

    async def __aexit__(self, exc_type: Any, exc: Any, tb: Any) -> None:
        if exc:
            logger.warn(f"Redis Exception: {exc}. Do not reuse connection...")
            pool.conn_error(self.conn)
        else:
            pool.push(self.conn)
        self.conn = None

        global counter
        counter -= 1


def get_connection() -> RedisConnectionContextManager:
    """
    Returns contextmanager for a redis connection.
    """
    return RedisConnectionContextManager()
