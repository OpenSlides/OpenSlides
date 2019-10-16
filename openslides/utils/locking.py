from typing import Dict

from typing_extensions import Protocol

from .redis import use_redis


if use_redis:
    from .redis import get_connection


class LockProtocol(Protocol):
    async def set(self, lock_name: str) -> bool:
        ...

    async def get(self, lock_name: str) -> bool:
        ...

    async def delete(self, lock_name: str) -> None:
        ...


class RedisLockProvider:
    lock_prefix = "lock_"

    async def set(self, lock_name: str) -> bool:
        """
        Tries to sets a lock.

        Returns True when the lock could be set and False, if it was already set.
        """
        # TODO: Improve lock. See: https://redis.io/topics/distlock
        async with get_connection() as redis:
            return await redis.setnx(f"{self.lock_prefix}{lock_name}", 1)

    async def get(self, lock_name: str) -> bool:
        """
        Returns True, when the lock is set. Else False.
        """
        # Execute the lookup on the main redis server (no readonly) to avoid
        # eventual consistency between the master and replicas
        async with get_connection() as redis:
            return await redis.get(f"{self.lock_prefix}{lock_name}")

    async def delete(self, lock_name: str) -> None:
        """
        Deletes the lock. Does nothing when the lock is not set.
        """
        async with get_connection() as redis:
            await redis.delete(f"{self.lock_prefix}{lock_name}")


class MemoryLockProvider:
    def __init__(self) -> None:
        self.locks: Dict[str, str] = {}

    async def set(self, lock_name: str) -> bool:
        if lock_name in self.locks:
            return False
        self.locks[lock_name] = "1"
        return True

    async def get(self, lock_name: str) -> bool:
        return lock_name in self.locks

    async def delete(self, lock_name: str) -> None:
        try:
            del self.locks[lock_name]
        except KeyError:
            pass


def load_lock_provider() -> LockProtocol:
    """
    Generates an lock provider singleton.
    """
    if use_redis:
        lock_provider: LockProtocol = RedisLockProvider()
    else:
        lock_provider = MemoryLockProvider()

    return lock_provider


locking = load_lock_provider()
