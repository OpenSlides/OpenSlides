import json
from typing import Any

from django.conf import settings
from typing_extensions import Protocol

from . import logging
from .redis import use_redis


logger = logging.getLogger(__name__)

REDIS_STREAM_MAXLEN = getattr(settings, "REDIS_STREAM_MAXLEN", None)
logger.info(f"Redis stream maxlen {REDIS_STREAM_MAXLEN}")

if use_redis:
    from .redis import get_connection


class Stream(Protocol):
    def __init__(self) -> None:
        ...

    async def send(self, stream_name: str, payload: Any) -> None:
        ...


class RedisStream:
    async def send(self, stream_name: str, payload: Any) -> None:
        fields = {
            "content": json.dumps(payload, separators=(",", ":")),
        }
        async with get_connection() as redis:
            await redis.xadd(stream_name, fields, max_len=REDIS_STREAM_MAXLEN)


class NoopStream:
    async def send(self, stream_name: str, payload: Any) -> None:
        pass


def load_stream() -> Stream:
    if use_redis:
        return RedisStream()
    else:
        logger.error("You have to configure redis to let OpenSlides work properly!")
        return NoopStream()


stream = load_stream()
