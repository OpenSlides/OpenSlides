import asyncio
import logging
import time
from typing import List


class WebsocketLatencyLogger:
    """
    Loggs latencies reported by clients during the ping-pong messages. Collects
    them and calculate the mean and standard derivation in 60 second intervalls
    and print these stats to the logger.

    Usage: WebsocketLatencyLogger.add_latency(<latency>)
    """

    lock = asyncio.Lock()
    """ Locks the access to the shared latency list. """

    instance = None
    """ The only latencylogger instance. """

    logger = logging.getLogger("openslides.websocket.latency")
    """ The logger to log to. """

    def __init__(self) -> None:
        self.reset()

    @classmethod
    async def add_latency(cls, latency: int) -> None:
        """ Add the latency to the logger. """
        # pass the latency value to the single instance
        if cls.instance is None:
            cls.instance = cls()
        await cls.instance._add_latency(latency)

    async def _add_latency(self, latency: int) -> None:
        async with self.lock:
            self.latencies.append(latency)

            # If we waited longer then 60 seconds, flush the data.
            current_time = time.time()
            if current_time > (self.time + 60):
                self.flush()
                return

            # If we have collected too many entries, flush the data.
            if len(self.latencies) > 1000:
                self.flush()

    def flush(self) -> None:
        """ Calc Stats and print to logger. """
        N = len(self.latencies)
        mean = sum(self.latencies) / N
        std = sum((l - mean) ** 2 for l in self.latencies)
        self.logger.debug(f"N={N}, mean={mean:.2f}, std={std:.2f}")

        self.reset()

    def reset(self) -> None:
        """ Resets the stats. """
        self.latencies: List[int] = []
        self.time = time.time()
