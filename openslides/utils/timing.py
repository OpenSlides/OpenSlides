import time
from typing import List, Optional

from . import logging


timelogger = logging.getLogger(__name__)


class Timing:
    def __init__(self, name: str) -> None:
        self.name = name
        self.times: List[float] = [time.time()]

    def __call__(self, done: Optional[bool] = False) -> None:
        self.times.append(time.time())
        if done:
            self.printtime()

    def printtime(self) -> None:
        s = f"{self.name}: "
        for i in range(1, len(self.times)):
            diff = self.times[i] - self.times[i - 1]
            s += f"{i}: {diff:.5f} "
        diff = self.times[-1] - self.times[0]
        s += f"sum: {diff:.5f}"
        timelogger.info(s)
