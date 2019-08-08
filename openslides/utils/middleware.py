from typing import Any, Dict, Optional

from channels.auth import (
    AuthMiddleware,
    CookieMiddleware,
    SessionMiddleware,
    _get_user_session_key,
)
from django.conf import settings
from django.contrib.auth import BACKEND_SESSION_KEY, HASH_SESSION_KEY
from django.utils.crypto import constant_time_compare

from .cache import element_cache


class CollectionAuthMiddleware(AuthMiddleware):
    """
    Like the channels AuthMiddleware but returns a user dict id instead of
    a django Model as user.
    """

    def populate_scope(self, scope: Dict[str, Any]) -> None:
        # Make sure we have a session
        if "session" not in scope:
            raise ValueError(
                "AuthMiddleware cannot find session in scope. SessionMiddleware must be above it."
            )
        # Add it to the scope if it's not there already
        if "user" not in scope:
            scope["user"] = {}

    async def resolve_scope(self, scope: Dict[str, Any]) -> None:
        scope["user"].update(await get_user(scope))


async def get_user(scope: Dict[str, Any]) -> Dict[str, Any]:
    """
    Returns a user id from a channels-scope-session.

    If no user is retrieved, return {'id': 0}.
    """
    # This code is basicly from channels.auth:
    # https://github.com/django/channels/blob/d5e81a78e96770127da79248349808b6ee6ec2a7/channels/auth.py#L16
    if "session" not in scope:
        raise ValueError(
            "Cannot find session in scope. You should wrap your consumer in SessionMiddleware."
        )
    session = scope["session"]
    user: Optional[Dict[str, Any]] = None
    try:
        user_id = _get_user_session_key(session)
        backend_path = session[BACKEND_SESSION_KEY]
    except KeyError:
        pass
    else:
        if backend_path in settings.AUTHENTICATION_BACKENDS:
            user = await element_cache.get_element_data("users/user", user_id)
            if user:
                # Verify the session
                session_hash = session.get(HASH_SESSION_KEY)
                session_hash_verified = session_hash and constant_time_compare(
                    session_hash, user["session_auth_hash"]
                )
                if not session_hash_verified:
                    session.flush()
                    user = None
    return user or {"id": 0}


# Handy shortcut for applying all three layers at once
AuthMiddlewareStack = lambda inner: CookieMiddleware(  # noqa
    SessionMiddleware(CollectionAuthMiddleware(inner))
)
