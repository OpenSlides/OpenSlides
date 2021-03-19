from typing import Any

from django.contrib.auth.backends import ModelBackend as _ModelBackend


class ModelBackend(_ModelBackend):
    def user_can_authenticate(self, user: Any) -> bool:
        """
        Overwrite the default check for is_active.
        This allows us to do the check it later to distinguish between a user
        have not the right credentials and having the right credentials but
        not being active.
        """
        return True
