import os
from collections import defaultdict
from typing import Callable, Dict, List

from django.apps import apps

from . import logging


logger = logging.getLogger(__name__)


def run_startup_hooks() -> None:
    """
    Collects all hooks via `get_startup_hooks` (optional) from all
    app configs. Sort the hooks witrh their weight and execute them in order.
    """
    if os.environ.get("NO_STARTUP"):
        return

    startup_hooks: Dict[int, List[Callable[[], None]]] = defaultdict(list)
    for app in apps.get_app_configs():
        try:
            get_startup_hooks = app.get_startup_hooks
        except AttributeError:
            # The app doesn't have this method. Continue to next app.
            continue
        app_hooks = get_startup_hooks()
        for weight, hooks in app_hooks.items():
            if not isinstance(hooks, list):
                hooks = [hooks]
            startup_hooks[weight].extend(hooks)

    for weight in sorted(startup_hooks.keys()):
        for hook in startup_hooks[weight]:
            logger.debug(f'Running startup hook "{hook.__name__}"')
            hook()
