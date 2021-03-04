# type: ignore
from time import sleep

from asgiref.sync import async_to_sync
from django.conf import settings
from django.contrib.sessions.backends.base import (
    VALID_KEY_CHARS,
    CreateError,
    SessionBase,
)
from django.utils.crypto import get_random_string, salted_hmac
from django.utils.encoding import force_str

from .redis import get_connection


REDIS_SESSION_PREFIX = getattr(settings, "REDIS_SESSION_PREFIX", "session:")


def to_redis_key(session_key):
    return f"{REDIS_SESSION_PREFIX}{session_key}"


class SessionStore(SessionBase):
    """
    Implements Redis database session store.
    """

    def __init__(self, session_key=None):
        super(SessionStore, self).__init__(session_key)

    def _hash(self, value):
        key_salt = "openslides.utils.sessions.SessionStore"
        return salted_hmac(key_salt, value).hexdigest()

    def load(self):
        retries = 0
        while True:
            try:
                return async_to_sync(self._load)()
            except TimeoutError as e:
                if retries < 3:
                    sleep(0.1)
                else:
                    raise e
            retries += 1

    async def _load(self):
        async with get_connection(read_only=True) as redis:
            try:
                key = to_redis_key(self._get_or_create_session_key())
                session_data = await redis.get(key)
                return self.decode(force_str(session_data))
            except Exception:
                self._session_key = None
                return {}

    def exists(self, session_key):
        return async_to_sync(self._load)(session_key)

    async def _exists(self, session_key):
        async with get_connection(read_only=True) as redis:
            key = to_redis_key(session_key)
            return await redis.exists(key)

    def create(self):
        async_to_sync(self._create)()

    async def _create(self):
        while True:
            self._session_key = await self._async_get_new_session_key()

            try:
                await self._save(must_create=True)
            except CreateError:
                # Key wasn't unique. Try again.
                continue
            self.modified = True
            return

    def save(self, must_create=False):
        async_to_sync(self._save)(must_create)

    async def _save(self, must_create=False):
        async with get_connection() as redis:
            if self.session_key is None:
                return await self._create()
            if must_create and await self._exists(self._get_or_create_session_key()):
                raise CreateError
            data = self.encode(self._get_session(no_load=must_create))
            await redis.setex(
                to_redis_key(self._get_or_create_session_key()),
                self.get_expiry_age(),
                data,
            )

    def delete(self, session_key=None):
        async_to_sync(self._delete)(session_key)

    async def _delete(self, session_key=None):
        if session_key is None:
            if self.session_key is None:
                return
            session_key = self.session_key

        async with get_connection() as redis:
            await redis.delete(to_redis_key(session_key))

    # This must be overwritten to stay inside async code...
    async def _async_get_new_session_key(self):
        "Return session key that isn't being used."
        while True:
            session_key = get_random_string(32, VALID_KEY_CHARS)
            if not await self._exists(session_key):
                return session_key

    @classmethod
    def clear_expired(cls):
        pass
