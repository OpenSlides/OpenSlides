import logging as python_logging
from typing import Any, MutableMapping, Tuple

from .utils import get_worker_id


class LoggerAdapter(python_logging.LoggerAdapter):
    """
    Custom adapter for adding a prefix given in the constructor to every log
    statement.
    """

    def __init__(self, prefix: str, logger: python_logging.Logger) -> None:
        super().__init__(logger, {})
        self.prefix = prefix

    def process(
        self, msg: str, kwargs: MutableMapping[str, Any]
    ) -> Tuple[str, MutableMapping[str, Any]]:
        return f"[{self.prefix}] {msg}", kwargs


def getLogger(name: str) -> LoggerAdapter:
    """
    This method is for a drop-in replacement for the loggging module:
    Use `from openslides.utils import logging` instead of `import logging`
    """
    logger = python_logging.getLogger(name)
    return LoggerAdapter(get_worker_id(), logger)
