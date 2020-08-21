from typing import Any

from django.conf import settings

from . import logging


logger = logging.getLogger(__name__)

# Defaults
use_redis = False
use_read_only_redis = False
read_only_redis_amount_replicas = None
read_only_redis_wait_timeout = None

try:
    import aioredis
except ImportError:
    pass
else:
    from .redis_connection_pool import ConnectionPool

    # set use_redis to true, if there is a value for REDIS_ADDRESS in the settings
    redis_address = getattr(settings, "REDIS_ADDRESS", "")
    use_redis = bool(redis_address)

    if use_redis:
        logger.info(f"Redis address {redis_address}")
        pool = ConnectionPool({"address": redis_address})

        redis_read_only_address = getattr(settings, "REDIS_READ_ONLY_ADDRESS", "")
        use_read_only_redis = bool(redis_read_only_address)
        if use_read_only_redis:
            logger.info(f"Redis read only address {redis_read_only_address}")
            read_only_pool = ConnectionPool({"address": redis_read_only_address})

            read_only_redis_amount_replicas = getattr(settings, "AMOUNT_REPLICAS", 1)
            logger.info(f"AMOUNT_REPLICAS={read_only_redis_amount_replicas}")
            read_only_redis_wait_timeout = getattr(
                settings, "REDIS_SLAVE_WAIT_TIMEOUT", 1000
            )
            logger.info(f"REDIS_SLAVE_WAIT_TIMEOUT={read_only_redis_wait_timeout}")
    else:
        logger.info("Redis is not configured.")


# TODO: contextlib.asynccontextmanager can be used in python 3.7
class RedisConnectionContextManager:
    """
    Async context manager for connections
    """

    def __init__(self, read_only: bool) -> None:
        self.pool = read_only_pool if read_only and use_read_only_redis else pool

    async def __aenter__(self) -> "aioredis.RedisConnection":
        self.conn = await self.pool.pop()
        return self.conn

    async def __aexit__(self, exc_type: Any, exc: Any, tb: Any) -> None:
        if exc:
            logger.warn(f"Redis Exception: {exc}. Do not reuse connection...")
            self.pool.conn_error(self.conn)
        else:
            self.pool.push(self.conn)
        self.conn = None


def get_connection(read_only: bool = False) -> RedisConnectionContextManager:
    """
    Returns contextmanager for a redis connection.
    """
    return RedisConnectionContextManager(read_only)
