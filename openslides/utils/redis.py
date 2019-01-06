from typing import Any

from django.conf import settings


try:
    import aioredis
except ImportError:
    use_redis = False
else:
    # set use_redis to true, if there is a value for REDIS_ADDRESS in the settings
    redis_address = getattr(settings, "REDIS_ADDRESS", "")
    use_redis = bool(redis_address)


class RedisConnectionContextManager:
    """
    Async context manager for connections
    """

    # TODO: contextlib.asynccontextmanager can be used in python 3.7

    def __init__(self, redis_address: str) -> None:
        self.redis_address = redis_address

    async def __aenter__(self) -> "aioredis.RedisConnection":
        self.conn = await aioredis.create_redis(self.redis_address)
        return self.conn

    async def __aexit__(self, exc_type: Any, exc: Any, tb: Any) -> None:
        self.conn.close()


def get_connection() -> RedisConnectionContextManager:
    """
    Returns contextmanager for a redis connection.
    """
    return RedisConnectionContextManager(redis_address)
