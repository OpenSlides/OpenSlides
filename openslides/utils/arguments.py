from argparse import Namespace
from typing import Any, Optional


class OpenSlidesArguments:
    args: Optional[Namespace] = None

    def __getitem__(self, key: str) -> Any:
        if not self.args:
            raise KeyError("Arguments are not set.")
        if not hasattr(self.args, key):
            raise KeyError(f"Key '{key}' is not in the OpenSlides arguments.")
        return getattr(self.args, key)

    def get(self, key: str, default: Any) -> Any:
        if not self.args or not hasattr(self.args, key):
            return default
        else:
            return getattr(self.args, key)

    def set_arguments(self, args: Namespace) -> None:
        self.args = args


arguments = OpenSlidesArguments()
