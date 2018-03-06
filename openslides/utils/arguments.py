from argparse import Namespace
from typing import Any, Union  # noqa


class OpenSlidesArguments():
    args = None  # type: Union[None, Namespace]

    def __getitem__(self, key: str) -> Any:
        if not self.args:
            raise KeyError("Arguments are not set.")
        if not hasattr(self.args, key):
            raise KeyError("Key '{}' is not in the OpenSlides arguments.".format(key))
        return getattr(self.args, key)

    def get(self, key: str, default: Any) -> Any:
        if not self.args or not hasattr(self.args, key):
            return default
        else:
            return getattr(self.args, key)

    def set_arguments(self, args: Namespace) -> None:
        self.args = args


arguments = OpenSlidesArguments()
