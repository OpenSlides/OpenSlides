from typing import Any, Dict, List, Optional

from django.apps import apps

from openslides.utils import logging


logger = logging.getLogger(__name__)


class UserBackendException(Exception):
    pass


class BaseUserBackend:
    """
    Base user backend providing methods to overwrite and provides
    a representation for clients. The backendname must be unique.
    """

    @property
    def name(self) -> str:
        raise NotImplementedError("Each Backend must provie a name")

    def get_disallowed_update_keys(self) -> List[str]:
        raise NotImplementedError("Each Backend must provie a name")

    def for_client(self) -> Dict[str, Any]:
        return {"disallowedUpdateKeys": self.get_disallowed_update_keys()}


class DefaultUserBackend(BaseUserBackend):
    """ The default user backend for OpenSlides """

    @property
    def name(self) -> str:
        return "default"

    def get_disallowed_update_keys(self) -> List[str]:
        return []


class UserBackendManager:
    """
    Manages user backends.

    Can collect backends from app configs.
    """

    def __init__(self):
        self.backends: Dict[str, BaseUserBackend] = {}

    def collect_backends_from_apps(self):
        """ Iterate through app configs and get an optional "user_backend_class" for a backend """
        for app in apps.get_app_configs():
            user_backend_class = getattr(app, "user_backend_class", None)
            if user_backend_class:
                self.register_user_backend(user_backend_class())

    def register_user_backend(self, backend: BaseUserBackend):
        """ Registeres a user backend """
        if backend.name in self.backends:
            raise UserBackendException(
                f"The user backend {backend.name} already exists."
            )
        self.backends[backend.name] = backend
        logger.debug(f'Registered user backend "{backend.name}"')

    def get_backend(self, name: str) -> Optional[BaseUserBackend]:
        if name not in self.backends:
            all_backend_names = ", ".join(self.backends.keys())
            raise UserBackendException(
                f'The backend "{name}" is not registered. All Backends: "{all_backend_names}"'
            )
        return self.backends[name]

    def get_backends_for_client(self) -> Dict[str, Dict[str, Any]]:
        """ Formats the backends for the client """
        return {name: backend.for_client() for name, backend in self.backends.items()}


user_backend_manager = UserBackendManager()
